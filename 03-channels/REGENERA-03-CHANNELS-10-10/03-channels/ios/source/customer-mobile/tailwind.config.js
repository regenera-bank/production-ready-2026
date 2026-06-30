
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'bg-deep': '#020617',
        'bg-mid': '#0a0f1e',
        'primary': '#22d3ee',
        'primary-dark': '#0891b2',
      },
    },
  },
  plugins: [],
}
