import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          deep: '#020617',
          mid: '#0f172a',
          light: '#1e293b',
        },
        primary: {
          DEFAULT: '#22d3ee',
          dark: '#0891b2',
          light: '#67e8f9',
          glow: 'rgba(34, 211, 238, 0.4)',
          surface: 'rgba(255, 255, 255, 0.06)',
        },
        navy: '#1e3a8a',
        'brand-cyan': '#22d3ee',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};