import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                syne: ['Syne', 'sans-serif'],
                'dm-sans': ['DM Sans', 'sans-serif'],
            },
            colors: {
                'yo-black': '#0a0a0a',
                'yo-white': '#f5f4f0',
                'yo-yellow': '#d4f500',
                'yo-green': '#00e87a',
                'yo-gray': '#1a1a1a',
                'yo-muted': '#3a3a3a',
                'yo-border': '#2a2a2a',
            },
        },
    },
    plugins: [],
};

export default config;
