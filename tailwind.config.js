/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        night: "#081522",
        panel: "#0f2030",
        aqua: "#60ead0",
        electric: "#83a7ff",
        ink: "#25304f",
        transit: {
          50: "#f4f6fc",
          100: "#e9edff",
          500: "#536bb7",
          600: "#43599f",
          700: "#354b8d",
        },
        accent: "#ef8e4b",
        canvas: "#f4f5fb",
      },
      boxShadow: {
        soft: "0 14px 40px rgba(20, 42, 53, 0.08)",
      },
    },
  },
  plugins: [],
};
