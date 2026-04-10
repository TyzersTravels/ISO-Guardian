/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        outfit: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          cyan: '#06b6d4',
          purple: '#8b5cf6',
          slate: '#0f172a',
        }
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
      },
      animation: {
        'fade-in': 'fade-in 0.8s ease-out',
        'fade-in-delayed': 'fade-in 0.8s ease-out 0.3s both',
        'slide-up': 'slide-up 0.6s ease-out 0.4s both',
        'slide-in': 'slide-in 0.3s ease-out',
        'float': 'float linear infinite',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        'beam': 'beam 3s ease-in-out infinite',
        'beam-delayed': 'beam 3s ease-in-out 1s infinite',
        'beam-slow': 'beam 4s ease-in-out 2s infinite',
        'shake': 'shake 0.5s ease-in-out',
        'toast-in': 'toast-in 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite',
        'connector': 'connector 2s linear infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'orbit': 'orbit 20s linear infinite',
        // Landing page animations
        'mesh-1': 'mesh-float-1 20s ease-in-out infinite',
        'mesh-2': 'mesh-float-2 25s ease-in-out infinite',
        'reveal-up': 'reveal-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'cursor-blink': 'cursor-blink 1s step-end infinite',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)', opacity: '0.3' },
          '50%': { transform: 'translateY(-20px)', opacity: '0.8' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.6' },
        },
        'beam': {
          '0%, 100%': { transform: 'translateX(-100%)', opacity: '0' },
          '50%': { opacity: '1' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-10px)' },
          '75%': { transform: 'translateX(10px)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateX(100px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(6, 182, 212, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.6)' },
        },
        'connector': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-15px) rotate(3deg)' },
        },
        'orbit': {
          '0%': { transform: 'rotate(0deg) translateX(40px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(40px) rotate(-360deg)' },
        },
        // Landing page keyframes
        'mesh-float-1': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(50px, -30px) scale(1.05)' },
          '66%': { transform: 'translate(-20px, 25px) scale(0.97)' },
        },
        'mesh-float-2': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(-35px, 20px) scale(0.95)' },
          '66%': { transform: 'translate(25px, -40px) scale(1.04)' },
        },
        'reveal-up': {
          from: { opacity: '0', transform: 'translateY(24px) translateZ(0)' },
          to: { opacity: '1', transform: 'translateY(0) translateZ(0)' },
        },
        'cursor-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
