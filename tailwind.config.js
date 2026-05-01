/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable manual dark mode toggle via 'dark' class
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      colors: {
        'agri-green': '#10b981',
        'agri-green-light': '#34d399',
        'tech-blue': '#3b82f6',
        'tech-blue-light': '#60a5fa',
        'alert-red': '#ef4444',
        'alert-orange': '#f59e0b',
        'dark-bg': '#0f172a',
        'dark-card': '#1e293b'
      }
    },
  },
  plugins: [],
}
