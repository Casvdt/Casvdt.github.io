/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './*.html',
    './**/*.html',
    './js/**/*.js'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1c3b6d',
        primaryHover: '#152b4d',
        secondary: '#ef4444',
        accent: '#22c55e',
        accent2: '#f59e0b',
      },
      boxShadow: {
        card: '0 4px 6px rgba(0, 0, 0, 0.35)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
};
