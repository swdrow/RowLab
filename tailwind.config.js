/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'rowing-blue': '#1e3a8a',
        'rowing-gold': '#fbbf24',
        'port': '#ef4444',
        'starboard': '#22c55e',
      },
    },
  },
  plugins: [],
}
