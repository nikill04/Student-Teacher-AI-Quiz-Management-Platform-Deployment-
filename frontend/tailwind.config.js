/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Main app colour (a calm ink blue). Use it like: bg-brand-600, text-brand-700
      // To change the whole app's colour, change only these values.
      colors: {
        brand: {
          50: '#eff5fc',
          100: '#dbe8f7',
          200: '#bdd5f0',
          300: '#90b8e4',
          400: '#5c94d4',
          500: '#3a76c2',
          600: '#2a5ea8',
          700: '#234c89',
          800: '#213f70',
          900: '#1f365d',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
