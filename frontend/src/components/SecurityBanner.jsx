import React from 'react';
import { ShieldCheck, AlertTriangle, Lock } from 'lucide-react';

const SecurityBanner = ({ trustScore }) => {
    let status = "SECURE";
    let color = "bg-emerald-500/10 border-emerald-500/50 text-emerald-400";
    let icon = <ShieldCheck className="w-5 h-5" />;

    if (trustScore < 0.5) {
        status = "CRITICAL LOCKDOWN";
        color = "bg-rose-900/90 border-rose-500 text-white animate-pulse";
        icon = <Lock className="w-5 h-5" />;
    } else if (trustScore < 0.8) {
        status = "ELEVATED RISK";
        color = "bg-amber-500/10 border-amber-500/50 text-amber-400";
        icon = <AlertTriangle className="w-5 h-5" />;
    }

    return (
        <div className={`w-full py-2 px-4 border-b flex items-center justify-center gap-3 backdrop-blur-sm transition-colors duration-500 ${color}`}>
            {icon}
            <span className="font-mono font-bold tracking-widest text-sm">
                THREAT LEVEL: {status}
            </span>
            <span className="text-xs opacity-70 border-l border-current pl-3 ml-1">
                TRUST: {(trustScore * 100).toFixed(0)}%
            </span>
        </div>
    );
};

export default SecurityBanner;
