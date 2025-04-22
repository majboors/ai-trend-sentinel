
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        background: {
          DEFAULT: "hsl(230, 25%, 13%)",  // Dark background
          foreground: "hsl(210, 40%, 98%)",  // Light text on dark background
        },
        primary: {
          DEFAULT: "hsl(217, 91%, 59%)",  // Bright blue
          foreground: "hsl(222, 47%, 11%)",  // Dark text on primary
        },
        sidebar: {
          DEFAULT: "hsl(230, 25%, 15%)",  // Slightly lighter than background
          foreground: "hsl(210, 40%, 98%)",
          border: "hsl(217, 32%, 17%)"
        },
        card: {
          DEFAULT: "hsl(230, 25%, 15%)",
          foreground: "hsl(210, 40%, 98%)"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
