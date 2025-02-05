/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          purple: '#9747FF',
          pink: '#FF6B8B',
        },
        dark: {
          bg: '#1A1D21',
          card: '#22262A',
          text: '#FFFFFF',
          'text-secondary': '#A1A1AA',
        },
      },
    },
  },
  plugins: [],
} 