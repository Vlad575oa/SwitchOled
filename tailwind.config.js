/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1320px",
        xl: "1380px",
        "2xl": "1440px",
      },
    },
    extend: {
      colors: {
        primary: "#e60012", // Nintendo Red
        secondary: "#2d2d2d",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
