/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        PrimaryColor: "#fee8ff",
        SecondaryColor: "#f8abfc",
        DarkColor: "#89198f",
        ExtraDarkColor: "#89198f",
      },
    },
  },
  plugins: [],
};
