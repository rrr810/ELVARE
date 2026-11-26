/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        elvare: {
          black: '#11110F',
          charcoal: '#1C1B18',
          gold: '#C7A66A',
          champagne: '#E3D0A8',
          ivory: '#F5F1E8',
          white: '#FFFDF8',
        },
      },
      fontFamily: {
        serif: ['Bodoni MT', 'Didot', 'Times New Roman', 'serif'],
        sans: ['Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
