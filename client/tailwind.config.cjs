/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: '#1e1e2e',
        surface: '#313244',
        overlay: '#45475a',
        text: '#cdd6f4',
        subtext: '#585b70',
        accent: '#4f46e5',
        'accent-light': '#6366f1',
        correct: '#a6e3a1',
        incorrect: '#f38ba8',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
