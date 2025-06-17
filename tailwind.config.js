module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      'pulse-slow': 'pulse 6s ease-in-out infinite',
      colors: {
        primary: "#243E8B",
        secondary: {
          100: "#FFB81C",
          200: "#F8E3B4",
        },
      },
      textColor: {
        primary: "#243E8B",
        secondary: {
          100: "#FFB81C",
          200: "#F8E3B4",
        },
      },
      animation: {
        'shake-fall': 'shake 0.5s, fall 1s forwards',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-10px)' },
          '40%, 80%': { transform: 'translateX(10px)' },
        },
        fall: {
          to: { transform: 'translateY(300px)', opacity: 0 },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
  ],
}
