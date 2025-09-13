/** @type {import('tailwindcss').Config} */

function generateDecimalPercentages() {
  const values = {};
  for (let i = 0.1; i <= 100; i = +(i + 0.1).toFixed(1)) {
    const key = `${i}%`;
    values[key] = key;
  }
  return values;
}

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        ...generateDecimalPercentages(),
      },
      width: {
        ...generateDecimalPercentages(),
      },
      height: {
        ...generateDecimalPercentages(),
      },
      inset: {
        ...generateDecimalPercentages(),
      },
      colors: {
        'sky-custom': '#5E9CAB',
        'sky-custom1': '#4A808C',
        'bleu-custom': '#3BACCE',
        'bleu-ver'   : '#92C1CB',
        'bleu-noir':'#305F6B',
        'chat-send':'#2B9CC8',
        'chat-revice':'#21A4AE'
      },
      fontFamily: {
        irish: ['"Irish Grover"', 'cursive'],
        inria: ['"Inria Sans"', 'sans-serif'],
        luckiest: ['"Luckiest Guy"', 'cursive'],
        inconsolata: ['"Inconsolata"', 'monospace'],
        rowdies: ['"Rowdies"', 'cursive'],
        poppins: ['"Poppins"', 'sans-serif'],
        forque: ['FORQUE', 'sans-serif']
      },
    },
    plugins: [
    require('tailwind-scrollbar-hide')
  ],
  },
  plugins: [
    require('tailwind-scrollbar-hide')
  ],
};



