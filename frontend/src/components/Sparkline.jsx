import React from 'react';

const Sparkline = ({ data, color = "text-cyan-400", height = 40 }) => {
    // Data should be an array of numbers
    if (!data || data.length < 2) return <div className={`h-[${height}px] w-full bg-slate-800/50 rounded animate-pulse`}></div>;

    const max = Math.max(...data, 100);
    const min = Math.min(...data, 0);
    const range = max - min || 1;

    // Create SVG path
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((val - min) / range) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={`w-full h-[${height}px] overflow-visible`}>
            {/* Gradient Area */}
            <defs>
                <linearGradient id="sparkGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path
                d={`M 0,100 ${points} L 100,100`}
                fill="url(#sparkGradient)"
                className={color}
            />
            {/* Line */}
            <path
                d={`M ${points}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                className={color}
            />
            {/* Pulse Dot at end */}
            <circle
                cx="100"
                cy={100 - ((data[data.length - 1] - min) / range) * 100}
                r="3"
                className={`${color} fill-current animate-pulse`}
            />
        </svg>
    );
};

export default Sparkline;
