// tailwind.config.js

import { plugin } from "mongoose";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./views/**/*.ejs", "node_modules/preline/dist/*.js"],
  theme: {
    extend: {
      colors: {
        "form-green": "#D6EFD8",
        "submit-button": "#059212",
        "toggle-field": "#007F73",
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      const newUtilities = {
        ".zoom-hover": {
          transition: "transform 0.3s ease-in-out",
        },
        ".zoom-hover:hover": {
          transform: "scale(1.5)",
        },
        ".zoom-origin-center": {
          transformOrigin: "center center",
        },
      };
      addUtilities(newUtilities, ["responsive", "hover"]);
    }),
    require("preline/plugin"),
  ],
};
