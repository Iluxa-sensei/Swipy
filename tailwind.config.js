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
        'gradient-primary': 'linear-gradient(135deg, #0A84FF 0%, #32D74B 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-tertiary': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'gradient-quaternary': 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
        'gradient-quinary': 'linear-gradient(135deg, #A8EDEA 0%, #FED6E3 100%)',
        'gradient-senary': 'linear-gradient(135deg, #FFD89B 0%, #19547B 100%)',
        'gradient-septenary': 'linear-gradient(135deg, #FF6B9D 0%, #C44569 100%)',
        'gradient-octonary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-nonary': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'gradient-denary': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
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
