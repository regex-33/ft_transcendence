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
        poppins: ['"Poppins"', 'sans-serif'],
      },

    },
  },
  plugins: [
  require('tailwind-scrollbar-hide')
]
}
