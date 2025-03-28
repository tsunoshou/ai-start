/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './presentation/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Hanken Grotesk', 'Noto Sans JP', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 