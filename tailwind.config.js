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
        'bg-primary': '#050505',
        'bg-secondary': '#0D0D0D',
        'bg-card': '#111111',
        'accent-purple': '#7C3AED',
        'accent-teal': '#0D9488',
        'text-primary': '#F9FAFB',
        'text-muted': '#6B7280',
        border: 'rgba(255, 255, 255, 0.08)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-live': 'pulse-live 1.5s ease-in-out infinite',
      },
      keyframes: {
        'pulse-live': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
      },
    },
  },
  plugins: [],
};