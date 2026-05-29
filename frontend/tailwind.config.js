/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        anime: {
          dark: "#0b0f19",
          panel: "#161e31",
          gold: "#f59e0b",
          red: "#f43f5e",
          green: "#10b981",
          blue: "#0ea5e9",
          purple: "#8b5cf6"
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glow-gold': '0 0 15px rgba(245, 158, 11, 0.4)',
        'glow-red': '0 0 15px rgba(244, 63, 94, 0.4)',
        'glow-blue': '0 0 15px rgba(14, 165, 233, 0.4)',
        'glow-green': '0 0 15px rgba(16, 185, 129, 0.4)',
      }
    },
  },
  plugins: [],
}
