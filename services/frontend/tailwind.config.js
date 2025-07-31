export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
     fontFamily: {
          irish: ['"Irish Grover"', 'cursive'],
          inria: ['"Inria Sans"', 'sans-serif'],
          luckiest: ['"Luckiest Guy"', 'cursive'],
          inconsolata: ['"Inconsolata"', 'monospace'],
          rowdies: ['"Rowdies"', 'cursive'], 
        },

    },
  },
  plugins: [
  require('tailwind-scrollbar-hide')
]
}