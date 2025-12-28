/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#020617", // Slate-950
                surface: "#0f172a", // Slate-900
                primary: "#22d3ee", // Cyan-400
                success: "#34d399", // Emerald-400
                warning: "#fbbf24", // Amber-400
                danger: "#f43f5e", // Rose-500
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            animation: {
                'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }
        },
    },
    plugins: [],
}
