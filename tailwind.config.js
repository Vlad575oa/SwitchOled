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
    },
    extend: {
      colors: {
        primary: "#e60012", // Nintendo Red
        secondary: "#2d2d2d",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        sparkle: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.15", transform: "scale(0.75)" },
        },
      },
      animation: {
        marquee: "marquee 20s linear infinite",
        "marquee-fast": "marquee 10s linear infinite",
        sparkle: "sparkle 3.5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
