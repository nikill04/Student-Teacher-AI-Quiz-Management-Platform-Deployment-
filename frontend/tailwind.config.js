/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Our own colours. Use them like: bg-brand-600, text-brand-700, bg-paper
      colors: {
        // Main accent: a deep "chalkboard" green
        brand: {
          50: '#eef6f1',
          100: '#d6eadf',
          200: '#afd4c0',
          300: '#7fb89c',
          400: '#4e9877',
          500: '#2f7c5c',
          600: '#21664a',
          700: '#1b533d',
          800: '#174333',
          900: '#13372a',
        },
        // Warm off-white page background (like paper)
        paper: '#f7f5f0',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'], // normal text
        serif: ['Fraunces', 'Georgia', 'serif'], // headings
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'], // numbers: scores, timer
      },
    },
  },
  plugins: [],
};
