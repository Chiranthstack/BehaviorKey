# 🧠 Behavioral Biometrics with Cryptographic Key Binding (Bio-Vault)

> **Conference-Grade Identity Assurance System**
> *Zero-Trust | Continuous Authentication | Fuzzy Cryptography*

![Banner](https://img.shields.io/badge/Security-Enterprise%20Grade-cyan?style=for-the-badge&logo=shield)
![Python](https://img.shields.io/badge/Backend-FastAPI%20%2B%20PyTorch-blue?style=for-the-badge&logo=python)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react)

## 🚨 Overview

This project implements a cutting-edge **Behavioral Biometrics Authentication System** that goes beyond passwords. It learns *how* you type (keystroke dynamics) to verify your identity continuously. 

Crucially, it implements **Fuzzy Cryptographic Key Binding**: your encryption keys are mathematically derived from your neural-motor patterns. If you are an impostor, the keys simply cannot be reconstructed—even if you steal the password.

### 🛡️ Key Features

*   **🧠 Multi-Model AI Engine**: Combines **Random Forest** (High Accuracy), **Autoencoder** (Deep Anomaly Detection), and **Isolation Forest** (Outlier Detection) for robust decision making.
*   **🔐 Fuzzy Vault Cryptography**: Zero-plaintext key storage. User secrets are encrypted using a "Biometric Key" generated on-the-fly from typing variance.
*   **📉 Continuous Trust Score**: Real-time **Exponential Moving Average (EMA)** trust scoring. Drop below 50% trust, and the system **autonomously locks down**.
*   **👁️ "Cyber-Intel" Dashboard**: A SOC-style interface offering real-time analytics, **Sparkline visualizations**, and explainable security audit logs.
*   **🛡️ Threat Simulation**: Proven defense against **Replay Attacks**, **Mimicry**, and **Session Hijacking**.

## 🏗️ Architecture

### Backend (`/backend`)
*   **Framework**: FastAPI (Python)
*   **ML Core**: Scikit-Learn & PyTorch
*   **Logic**:
    *   `ml_service.py`: Feature extraction (Hold Time, Flight Time, Entropy) & Model Training.
    *   `crypto_service.py`: Fuzzy Extractor implementation for stable key generation from noisy biometric data.
    *   `audit_service.py`: Privacy-preserving immutable logging.

### Frontend (`/frontend`)
*   **Framework**: React + Vite
*   **Styling**: Tailwind CSS (Custom "Deep Void" Theme)
*   **Visuals**: Recharts (Radar/Spider Charts), Lucide Icons.

## 🚀 Getting Started

### Prerequisites
*   Python 3.9+
*   Node.js 16+

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/yourusername/behavioral-biometrics.git
    cd behavioral-biometrics
    ```

2.  **Setup Backend**
    ```bash
    cd backend
    python -m venv venv
    # Windows
    venv\Scripts\activate
    # Mac/Linux
    # source venv/bin/activate
    pip install -r requirements.txt
    ```

3.  **Setup Frontend**
    ```bash
    cd ../frontend
    npm install
    ```

### Running the App
We provide a one-click startup script for Windows:
```bash
./run_app.bat
```
*Or manually:*
*   Backend: `uvicorn main:app --reload` (Port 8000)
*   Frontend: `npm run dev` (Port 5173/5174)

## 🎮 Usage Guide

1.  **Enrollment (`/enroll`)**: 
    *   Type the target phrase ("the quick brown fox...") 5 times.
    *   Watch the real-time analytics stabilize as the AI learns your pattern.
2.  **Verification (`/verify`)**:
    *   Enter the Secure Workspace. type naturally.
    *   Monitor the **Trust Gauge**. If it stays Green (>80%), your session is secure.
    *   **Attack Simulation**: Hand the keyboard to a friend. Watch the "Threat Level" rise and the system eventually **Lock Down**.
3.  **Audit (`/admin`)**:
    *   View detailed logs and **Radar Charts** explaining exactly *why* a user was rejected (e.g., "High Flight Time Variance").

## 🤝 Contribution
Open for research collaboration! Please check `LICENSE` for usage rights.

---
*Built with ❤️ by Antigravity*
