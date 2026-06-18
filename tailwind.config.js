/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        horror: {
          bg: "#0d0d14",
          panel: "#16161f",
          card: "#1e1e2a",
          border: "#2a2a3a",
          text: "#d4d4dc",
          muted: "#6b6b80",
          blood: "#8b0000",
          bloodLight: "#b22222",
          trigger: "#2d5a3d",
          triggerLight: "#3d7a4d",
          warning: "#b8860b",
          deficient: "#a03030",
          untriggered: "#3a3a4a",
        },
      },
      fontFamily: {
        display: ['"Cinzel"', '"Noto Serif SC"', "serif"],
        body: ['"Noto Sans SC"', '"Inter"', "sans-serif"],
      },
      boxShadow: {
        horror: "0 0 20px rgba(139, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
        glow: "0 0 15px rgba(139, 0, 0, 0.5)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        flicker: "flicker 2s linear infinite",
      },
      keyframes: {
        flicker: {
          "0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%": { opacity: "1" },
          "20%, 24%, 55%": { opacity: "0.4" },
        },
      },
    },
  },
  plugins: [],
};
