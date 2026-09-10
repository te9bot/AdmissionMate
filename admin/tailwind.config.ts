import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#F3F1FC",
          100: "#EAE6FA",
          200: "#D3CBF3",
          300: "#B7AEEA",
          400: "#9F97D6",
          500: "#8D85C9",
          600: "#756CB3",
          700: "#5C5498",
          800: "#433C77",
          900: "#2B2640",
          950: "#1D1930",
        },
        accent: {
          300: "#D5F281",
          400: "#C6F135",
          500: "#AEDA1E",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        panel: "0 20px 60px -20px rgba(43, 38, 64, 0.35)",
        card: "0 8px 24px -8px rgba(43, 38, 64, 0.25)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
