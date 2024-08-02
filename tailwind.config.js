// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './views/**/*.ejs'
  ],
  theme: {
    extend: {
      colors:{
        'form-green': '#D6EFD8',
        'submit-button': '#059212',
      }
    },
  },
  plugins: [],
}
