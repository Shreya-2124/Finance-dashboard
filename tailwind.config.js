/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 10px 25px -12px rgb(15 23 42 / 0.25)",
        "card-dark":
          "0 1px 3px 0 rgb(0 0 0 / 0.4), 0 12px 28px -10px rgb(0 0 0 / 0.55)",
      },
    },
  },
  plugins: [],
};
