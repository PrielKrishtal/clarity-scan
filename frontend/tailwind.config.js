/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {
      colors: {
        navy:    '#1B3A4B',
        teal:    '#2A9D8F',
        bgLight: '#F8FAFB',
        slate:   '#475569',
      }
    },
  },
  plugins: [],
}