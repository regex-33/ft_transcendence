
const MY = 'O';
const winningCombinations = [
    // Horizontal
    [[0, 0], [0, 1], [0, 2]],
    [[1, 0], [1, 1], [1, 2]],
    [[2, 0], [2, 1], [2, 2]],
    // Vertical
    [[0, 0], [1, 0], [2, 0]],
    [[0, 1], [1, 1], [2, 1]],
    [[0, 2], [1, 2], [2, 2]],
    // Diagonal
    [[0, 0], [1, 1], [2, 2]],
    [[0, 2], [1, 1], [2, 0]],
];

const FilterCells = (map) => {
    return winningCombinations.map(c => {
        const arr = [map[c[0][0]][c[0][1]].value, map[c[1][0]][c[1][1]].value, map[c[2][0]][c[2][1]].value];
        return arr.includes('X') && arr.includes('O') ? null : c;
    }).filter(c => c);
}

const getBestCells = (map) => {
    const BestCells = FilterCells(map);
    if (!BestCells.length) return null;
    const oneShotCells = BestCells.filter(c => {
        const arr = [map[c[0][0]][c[0][1]].value, map[c[1][0]][c[1][1]].value, map[c[2][0]][c[2][1]].value];
        return arr.filter(v => v == '').length === 1;
    });
    if (oneShotCells.length) {
        return oneShotCells;
    }
    const twoShotCells = BestCells.filter(c => {
        const arr = [map[c[0][0]][c[0][1]].value, map[c[1][0]][c[1][1]].value, map[c[2][0]][c[2][1]].value];
        return arr.filter(v => v == '').length === 2;
    });
    if (twoShotCells.length) {
        return twoShotCells;
    }
    return BestCells;
}

const getBestMove = (map) => {
    const BestCells = getBestCells(map);
    if (!BestCells || !BestCells.length) return null;
    const my = BestCells.filter(c => {
        const arr = [map[c[0][0]][c[0][1]].value, map[c[1][0]][c[1][1]].value, map[c[2][0]][c[2][1]].value];
        return arr.filter(v => v == MY).length !== 0;
    });
    if (my.length) {
        return my[0].find(c => map[c[0]][c[1]].value === '');
    }
    return BestCells[0].find(c => map[c[0]][c[1]].value === '');
}

const solve = (map) => {
    const cell = getBestMove(map);
    if (cell) {
        map[cell[0]][cell[1]].value = MY;
    }
    else {
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
                if (map[y][x].value === '') {
                    map[y][x].value = MY;
                    return map;
                }
            }
        }
    }
    return map;
}

const ifWin = (map) => {

    for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        if (map[a[0]][a[1]].value && map[a[0]][a[1]].value === map[b[0]][b[1]].value && map[a[0]][a[1]].value === map[c[0]][c[1]].value) {
            return { winner: map[a[0]][a[1]].value };
        }
    }

    return { winner: null };
}

module.exports = { solve, ifWin };