
/** 
 * @type {import('tailwindcss').Config} 
 * @description Architectural styling engine. Defines the exact physics of the UI.
 */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-deep': '#020617',
        'bg-mid': '#0a0f1e',
        'bg-glass': 'rgba(10, 15, 30, 0.65)',
        'text-primary': '#22d3ee',
        'neural-cyan': '#00f0ff',
        'neural-purple': '#7000ff',
        'neural-emerald': '#00ff88',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 240, 255, 0.4), 0 0 40px rgba(0, 240, 255, 0.1)',
        'neon-purple': '0 0 20px rgba(112, 0, 255, 0.4), 0 0 40px rgba(112, 0, 255, 0.1)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backgroundImage: {
        'mesh-pattern': 'radial-gradient(at 40% 20%, rgba(112, 0, 255, 0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(0, 240, 255, 0.15) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(0, 255, 136, 0.1) 0px, transparent 50%)',
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 4s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'data-stream': 'data-stream 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: 0.6, transform: 'scale(1)' },
          '50%': { opacity: 1, transform: 'scale(1.05)' },
        },
        'data-stream': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        }
      }
    },
  },
  plugins: [],
}
