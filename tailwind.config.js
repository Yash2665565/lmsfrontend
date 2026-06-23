/** @type {import('tailwindcss').Config} */

// Editorial / Warm Premium palette — cool Tailwind scales are remapped to warm
// equivalents so every utility (text-slate-800, bg-blue-50, hover:bg-indigo-50,
// borders, rings…) resolves to the warm theme automatically across the app.

const stone = {
  50: '#f4efe4', 100: '#ece4d4', 200: '#e3dac9', 300: '#d6cab2', 400: '#9c9482',
  500: '#726b5c', 600: '#5e5749', 700: '#463f33', 800: '#2f2a22', 900: '#211e18', 950: '#171410',
}
const pine = {
  50: '#e7efe9', 100: '#d7e6dc', 200: '#c8dacd', 300: '#a7c4b3', 400: '#5f8c76',
  500: '#2e6b4c', 600: '#1f4b38', 700: '#173829', 800: '#102619', 900: '#0c1d13', 950: '#08130c',
}
const moss = {
  50: '#e5f0e8', 100: '#d3e6d9', 200: '#c1d9c9', 300: '#9cc4ab', 400: '#5d9a78',
  500: '#3a8158', 600: '#2e6b4c', 700: '#245539', 800: '#1d4430', 900: '#163528', 950: '#0e2419',
}
const brick = {
  50: '#f6e6e0', 100: '#efd3c9', 200: '#e6c8bf', 300: '#d9a596', 400: '#c0705c',
  500: '#a23b2c', 600: '#933325', 700: '#8a3024', 800: '#71281e', 900: '#5c2018', 950: '#3d150f',
}
const brass = {
  50: '#f4e9d6', 100: '#ecdcbf', 200: '#e6d3b1', 300: '#d9bc86', 400: '#c89a5b',
  500: '#b07a3c', 600: '#8a5e2a', 700: '#71491f', 800: '#5c3b1a', 900: '#4a2f15', 950: '#2e1d0d',
}

export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // neutrals → warm stone
        slate: stone,
        gray: stone,
        zinc: stone,
        neutral: stone,
        stone,
        // primary accents → pine
        blue: pine,
        indigo: pine,
        violet: pine,
        sky: pine,
        // success → moss
        emerald: moss,
        green: moss,
        teal: moss,
        // danger → brick
        red: brick,
        rose: brick,
        // warning → brass
        amber: brass,
        yellow: brass,
        orange: brass,
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
