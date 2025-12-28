import React from 'react';
import { twMerge } from 'tailwind-merge';

const Badge = ({ children, variant = 'default', className, ...props }) => {
    const variants = {
        default: "bg-slate-800 text-slate-300 border-slate-700",
        success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        error: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        info: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    };

    return (
        <span
            className={twMerge("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", variants[variant], className)}
            {...props}
        >
            {children}
        </span>
    );
};

export default Badge;
