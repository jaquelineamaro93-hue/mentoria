import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#f7f6f1',
        canvas: '#f7f6f1',
        paper: '#fdfcf8',
        ink: '#14282A',
        'ink-deep': '#0D1E20',
        'ink-soft': '#26383A',
        'ink-faint': '#546365',
        line: '#DDE5E5',
        'line-soft': '#DDE5E5',

        brand: {
          DEFAULT: '#017A75',
          deep: '#015C58',
          soft: '#E3F4F3',
          border: '#BFE4E1',
          vivid: '#02a49d',
        },
        gold: {
          DEFAULT: '#ffce1b',
          ink: '#8a6800',
          deep: '#7a5c00',
          soft: '#fdf3d4',
          border: '#f2dfa0',
        },
        coral: {
          DEFAULT: '#8e0a1e',
          deep: '#6d0716',
          soft: '#fbebed',
          border: '#ebc9ce',
        },
        ice: {
          DEFAULT: '#add8e6',
          deep: '#31606f',
          soft: '#eaf4f8',
          border: '#c3d9e2',
        },

        // Nomes antigos preservados, valores novos
        brown: '#1E3634',
        'brown-deep': '#14282A',
        sky: '#017A75',
        'sky-deep': '#015C58',
        'sky-tint': '#E3F4F3',
        'mustard-light': '#fdf3d4',
        'gold-matte': '#8a6800',
        'emerald-light': '#BFE4E1',
        'lotus-brown': '#1E3634',
        'lotus-cream': '#f7f6f1',
        'lotus-coral': '#8e0a1e',
        'lotus-mint': '#02A49D',
        'lotus-lilac': '#ffce1b',
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