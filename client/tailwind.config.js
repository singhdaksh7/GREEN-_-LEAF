/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f1f9f0',
          100: '#dcf0da',
          200: '#bce2b8',
          300: '#8fcc89',
          400: '#5eae59',
          500: '#3d8f39',
          600: '#2c722a',
          700: '#245a24',
          800: '#1f481f',
          900: '#1a3c1b',
        },
        accent: {
          500: '#e8871e',
          600: '#d17210',
        },
        sale: {
          500: '#dc2626',
          600: '#b91c1c',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Poppins"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 10px 0 rgb(0 0 0 / 0.06)',
        cardHover: '0 8px 24px 0 rgb(0 0 0 / 0.10)',
      },
    },
  },
  plugins: [],
};
