/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f2f9f5',
          100: '#e1f2e7',
          200: '#c5e5d1',
          300: '#9bcfb0',
          400: '#6bb38a',
          500: '#46966c',
          600: '#347854',
          700: '#2b6045',
          800: '#244d39',
          900: '#1e4030',
          950: '#0e241b',
        },
        natural: {
          50: '#faf8f5',
          100: '#f4efe6',
          200: '#e7ddcb',
          300: '#d7c5a9',
          400: '#c5a984',
          500: '#b7936a',
          600: '#a87f5d',
          700: '#8c644c',
          800: '#725242',
          900: '#5e4438',
        },
        mint: {
          50: '#effcf6',
          100: '#d7f7e9',
          200: '#b2edd5',
          300: '#7dddbb',
          400: '#44c59c',
          500: '#23a982',
          600: '#158867',
          700: '#136d54',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
