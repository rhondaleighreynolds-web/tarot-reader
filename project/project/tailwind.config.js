/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Palatino Linotype', 'Book Antiqua', 'Palatino', 'Georgia', 'serif'],
        sans: ['Optima', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 3.5s linear infinite',
      },
    },
  },
  plugins: [],
};
