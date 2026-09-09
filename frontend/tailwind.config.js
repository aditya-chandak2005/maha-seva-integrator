/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          blue: "#0b3b60",
          navy: "#08243d",
          orange: "#e65100",
          lightOrange: "#fff3e0",
          gold: "#f59e0b",
          green: "#166534",
          lightGreen: "#dcfce7",
          bg: "#f8fafc",
          border: "#e2e8f0"
        }
      }
    },
  },
  plugins: [],
}
