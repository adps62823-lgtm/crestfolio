import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: "#050a0f",
          900: "#0a1219",
          800: "#0f1a24",
          700: "#16232f",
          600: "#20313f",
        },
        emerald: {
          400: "#34e2a8",
          500: "#1fcf94",
          600: "#14a878",
        },
        amber: {
          400: "#ffb454",
          500: "#f59e0b",
        },
        crimson: {
          400: "#ff6b6b",
          500: "#ef4444",
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "'IBM Plex Mono'", "ui-monospace", "monospace"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "glass-panel":
          "linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
      },
    },
  },
  plugins: [],
};
export default config;
