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
      // PlayStation-style tokens: design-md/design-md/playstation/DESIGN.md
      colors: {
        primary: {
          DEFAULT: "#0070d1",
          pressed: "#0064b7",
          active: "#004d8d",
        },
        commerce: {
          DEFAULT: "#d53b00",
          pressed: "#aa2f00",
        },
        secondary: "#000000",
        ink: {
          DEFAULT: "#000000",
          deep: "#121314",
          elevated: "#181818",
        },
        surface: {
          soft: "#f3f3f3",
          card: "#f5f7fa",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Arial", "Helvetica", "sans-serif"],
        display: ["var(--font-display)", "Arial", "Helvetica", "sans-serif"],
      },
      borderRadius: {
        lg: "8px",
        xl: "8px",
        "2xl": "8px",
        "3xl": "16px",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        sparkle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.15" },
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
