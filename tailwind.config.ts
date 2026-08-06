import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#f6f2e9',
        paper: '#fbf8f2',
        ink: '#362b21',
        'ink-soft': '#6b5d4f',
        'ink-faint': '#9c8f7e',
        brown: '#6b4a35',
        'brown-deep': '#3c2c1f',
        sky: '#7ea0c4',
        'sky-deep': '#4f7196',
        'sky-tint': '#e7eff6',
        line: '#ded4c3',
        'line-soft': '#ded4c3',
      },
      fontFamily: {
        display: ['Times New Roman', 'Times', 'serif'],
        body: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
