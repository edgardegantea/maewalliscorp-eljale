/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0A192F',    // Azul marino oscuro (fondo de la presentación)
          primary: '#FF6B00', // Naranja vibrante (color principal de "El Jale")
          accent: '#FFB800',  // Amarillo/Dorado (para estrellas y detalles)
          light: '#F3F4F6',   // Gris muy claro para fondos de la app
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Te sugiero Inter para una lectura limpia
      }
    },
  },
  plugins: [],
}