/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#1C1C1E',
        'bg-secondary': '#2C2C2E',
        'bg-tertiary': '#3A3A3C',
        'text-primary': '#FFFFFF',
        'text-secondary': '#AEAEB2',
        'accent-primary': '#0A84FF',
        'accent-secondary': '#32D74B',
        'accent-danger': '#FF453A',
        'accent-warning': '#FF9F0A',
        'glass-bg': 'rgba(255, 255, 255, 0.1)',
        'glass-border': 'rgba(255, 255, 255, 0.2)',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'light': '0 4px 20px rgba(0, 0, 0, 0.1)',
        'medium': '0 8px 32px rgba(0, 0, 0, 0.2)',
        'heavy': '0 20px 60px rgba(0, 0, 0, 0.4)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #90caf9 0%, #1565c0 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'gradient-tertiary': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'gradient-quaternary': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'gradient-quinary': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'gradient-senary': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'gradient-septenary': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        'gradient-octonary': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        'gradient-nonary': 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
        'gradient-denary': 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
      },
      animation: {
        'slideInRight': 'slideInRight 0.5s ease-out',
        'slideInLeft': 'slideInLeft 0.5s ease-out',
        'fadeIn': 'fadeIn 0.3s ease-out',
        'scaleIn': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
