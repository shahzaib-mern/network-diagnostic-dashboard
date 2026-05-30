/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
        sans:    ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      animation: {
        fadeIn:  'fadeIn 0.3s ease-out',
        slideUp: 'slideUp 0.25s ease-out both',
      },
    },
  },
  plugins: [],
};
