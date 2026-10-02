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
        background: "#050B14",
        foreground: "#E0E5EC",
        primary: {
          DEFAULT: "#00E5FF", // Neon Cyan
          dark: "#00B3CC",
        },
        secondary: {
          DEFAULT: "#7B00FF", // Neon Purple
          dark: "#5A00CC",
        },
        accent: "#FF0055", // Neon Pink/Red for Risk/High alerts
        card: "rgba(16, 25, 41, 0.7)",
        "card-border": "rgba(255, 255, 255, 0.1)",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-neon': 'linear-gradient(to right, #00E5FF, #7B00FF)',
      },
      boxShadow: {
        'neon': '0 0 15px rgba(0, 229, 255, 0.5)',
        'neon-purple': '0 0 15px rgba(123, 0, 255, 0.5)',
      }
    },
  },
  plugins: [],
};
export default config;
