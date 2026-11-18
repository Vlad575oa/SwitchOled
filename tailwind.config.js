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
      // Minimal monochrome storefront tokens
      colors: {
        primary: {
          DEFAULT: "#111111",
          pressed: "#2b2b2b",
          active: "#000000",
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
          soft: "#f5f5f5",
          card: "#f2f2f2",
          tile: "#ececec",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Arial", "Helvetica", "sans-serif"],
        display: ["var(--font-display)", "Arial", "Helvetica", "sans-serif"],
      },
      borderRadius: {
        lg: "10px",
        xl: "12px",
        "2xl": "16px",
        "3xl": "20px",
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
