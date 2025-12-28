import base64
import hashlib
import numpy as np
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

class CryptoManager:
    def __init__(self):
        # In memory storage for Vaults: { user_id: { 'vault': bytes, 'salt': bytes } }
        self.vaults = {}

    def _quantize_latent(self, latent_vector):
        """
        Converts detailed float vector into a stable discrete key.
        Strategy:
        1. Normalize to reasonable range [-2, 2] (tanh-like clipping)
        2. Bin into buckets (e.g. 0.5 step size)
        3. Stringify indices.
        """
        # Clip to ensure extreme outliers don't break binning
        clipped = np.clip(latent_vector, -3.0, 3.0)
        
        # Binning (Step size 1.0 implies coarser buckets = more error tolerance)
        # Smaller step = stricter key binding.
        # Let's try step=0.5
        bins = np.round(clipped / 0.5).astype(int)
        
        # Create string signature
        sig = ",".join(map(str, bins))
        return sig.encode('utf-8')

    def _derive_key(self, latent_sig, salt):
        """
        Derives a Fernet-compatible key from the quantized latent signature.
        """
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        return base64.urlsafe_b64encode(kdf.derive(latent_sig))

    def create_vault(self, user_id, latent_vector):
        """
        Creates a new encrypted vault for the user.
        Generates a random User Secret, locks it with Biometric Key.
        """
        # 1. Generate new random User Secret (Real Key)
        user_secret = Fernet.generate_key()
        
        # 2. Derive Biometric Key
        salt = os.urandom(16)
        latent_sig = self._quantize_latent(latent_vector)
        bio_key = self._derive_key(latent_sig, salt)
        
        # 3. Encrypt User Secret with Bio Key
        f = Fernet(bio_key)
        vault_data = f.encrypt(user_secret)
        
        # 4. Store (Vault + Salt)
        self.vaults[user_id] = {
            'vault': vault_data,
            'salt': salt
        }
        
        return user_secret # Return plaintext once for session init

    def unlock_vault(self, user_id, latent_vector):
        """
        Attempts to unlock the vault using a fresh latent vector.
        Returns User Secret if successful, None otherwise.
        """
        if user_id not in self.vaults:
            return None
            
        record = self.vaults[user_id]
        salt = record['salt']
        vault_data = record['vault']
        
        # 1. Derive candidate Biometric Key
        latent_sig = self._quantize_latent(latent_vector)
        bio_key = self._derive_key(latent_sig, salt)
        
        # 2. Attempt Decrypt
        try:
            f = Fernet(bio_key)
            user_secret = f.decrypt(vault_data)
            return user_secret
        except Exception as e:
            # Decryption failed (Biometric Key Mismatch -> Drift or Impostor)
            # print(f"Vault Decode Failed: {e}")
            return None

    def revoke_vault(self, user_id):
        if user_id in self.vaults:
            del self.vaults[user_id]
            
import os
