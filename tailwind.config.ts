import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17201A",
        leaf: "#28634F",
        moss: "#6B8E5B",
        skysoft: "#CFE8EF",
        marigold: "#F4B860",
        coral: "#D86F52"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(23, 32, 26, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
