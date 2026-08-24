import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Paleta Vibrante */
        black: '#1A1A1A',
        'dark-gray': '#2D2D2D',
        mint: '#3DD9C8',
        'mint-light': '#E8F5F3',
        'mint-border': '#B8E6DC',
        orange: '#FFB366',
        'orange-light': '#FFECD9',
        rose: '#FF7A8A',
        'rose-light': '#FFE5E8',
        'gray-light': '#F9F9F9',
        'gray-text': '#808080',
        'gray-faint': '#E8E8E8',

        /* Fallback para classes antigas */
        cream: '#F9F9F9',
        paper: '#FFFFFF',
        ink: '#1A1A1A',
        'ink-soft': '#808080',
        'ink-faint': '#999999',
        brown: '#FFB366',
        'brown-deep': '#1A1A1A',
        sky: '#3DD9C8',
        'sky-deep': '#3DD9C8',
        'sky-tint': '#E8F5F3',
        line: '#E8E8E8',
        'line-soft': '#F9F9F9',
      },
      fontFamily: {
        display: ['Crimson Text', 'serif'],
        body: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
