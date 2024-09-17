/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["*.html", "assets/js/script.js"],
  theme: {
    extend: {
      colors: {
        background: "rgb(23, 25, 27)",
      },
      size: {
        128: "32rem",
      },
      spacing: {
        128: "32rem",
      },
    },
  },
  plugins: [],
};
