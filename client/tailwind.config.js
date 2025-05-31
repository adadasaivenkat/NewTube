/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#FF0000",
        secondary: "#282828",
        dark: {
          bg: "#0F0F0F",
          text: "#FFFFFF",
          sidebar: "#212121",
          hover: "#303030"
        },
        light: {
          bg: "#FFFFFF",
          text: "#0F0F0F",
          sidebar: "#F2F2F2",
          hover: "#E5E5E5"
        }
      },
      fontFamily: {
        roboto: ['Roboto', 'sans-serif']
      }
    },
  },
  plugins: [],
}