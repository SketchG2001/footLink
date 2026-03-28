import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#1B5E20", light: "#388E3C", dark: "#0D3B12" },
        accent: { DEFAULT: "#F9A825", light: "#FDD835" },
      },
    },
  },
  plugins: [],
};

export default config;
