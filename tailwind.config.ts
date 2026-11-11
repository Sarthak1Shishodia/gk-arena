import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        premium: {
          beige: "#F7F5F0",
          charcoal: "#1A1A1A",
          gray: "#242424",
          border: "#E5E0D8",
          borderDark: "#333333",
          accent: "#B89B72",
        },
      },
    },
  },
};

export default config;
