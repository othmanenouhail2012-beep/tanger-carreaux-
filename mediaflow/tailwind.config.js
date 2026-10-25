export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        brand: { DEFAULT: 'rgb(var(--brand) / <alpha-value>)', dark: '#4D9900' },
        bg: 'rgb(var(--bg) / <alpha-value>)', surface: 'rgb(var(--surface) / <alpha-value>)',
        surface2: 'rgb(var(--surface2) / <alpha-value>)', ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)', line: 'rgb(var(--line) / <alpha-value>)',
      },
    },
  },
};
