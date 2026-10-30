import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#191817",
        leaf: "#BC340E",
        moss: "#51473F",
        skysoft: "#FFF0E8",
        marigold: "#FFB020",
        coral: "#DC2626",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(17, 17, 17, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
