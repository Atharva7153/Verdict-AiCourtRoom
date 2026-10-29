import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        court: {
          wood: "#d4a373",
          darkwood: "#8b5a2b",
          bench: "#e8c89b",
          marble: "#f4f1ea",
          accent: "#2c3e50",
          gavel: "#b23a22",
        },
      },
      fontFamily: {
        comic: ["Comic Sans MS", "Chalkboard SE", "Comic Neue", "sans-serif"],
      },
      boxShadow: {
        comic: "4px 4px 0px 0px rgba(0, 0, 0, 0.9)",
        "comic-lg": "6px 6px 0px 0px rgba(0, 0, 0, 0.9)",
      },
    },
  },
  plugins: [],
};
export default config;
