import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F172A",
          50: "#F8FAFC",
          100: "#F1F5F9",
        },
        accent: {
          DEFAULT: "#2563EB",
          dark: "#1D4ED8",
          light: "#3B82F6",
        },
      },
    },
  },
  plugins: [],
};

export default config;

