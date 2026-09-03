/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nubank: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#820ad1', // Nubank purple
          700: '#6d09b0',
          800: '#58078f',
          900: '#450670',
          950: '#2b0247',
        },
        dark: {
          bg: '#0B0F19',
          card: '#111827',
          cardHover: '#1F2937',
          border: '#374151',
          text: '#F9FAFB',
          subtext: '#9CA3AF',
        }
      },
    },
  },
  plugins: [],
}
