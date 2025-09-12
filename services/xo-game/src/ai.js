
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
        const arr = [map[c[0][0]][c[0][1]], map[c[1][0]][c[1][1]], map[c[2][0]][c[2][1]]];
        return arr.includes('X') && arr.includes('O') ? null : c;
    }).filter(c => c);
}

const getBestCells = (map) => {
    const BestCells = FilterCells(map);
    if (!BestCells.length) return null;
    const oneShotCells = BestCells.filter(c => {
        const arr = [map[c[0][0]][c[0][1]], map[c[1][0]][c[1][1]], map[c[2][0]][c[2][1]]];
        return arr.filter(v => v == '-').length === 1;
    });
    if (oneShotCells.length) {
        return oneShotCells;
    }
    const twoShotCells = BestCells.filter(c => {
        const arr = [map[c[0][0]][c[0][1]], map[c[1][0]][c[1][1]], map[c[2][0]][c[2][1]]];
        return arr.filter(v => v == '-').length === 2;
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
        const arr = [map[c[0][0]][c[0][1]], map[c[1][0]][c[1][1]], map[c[2][0]][c[2][1]]];
        return arr.filter(v => v == MY).length !== 0;
    });
    if (my.length) {
        return my[0].find(c => map[c[0]][c[1]] === '-');
    }
    return BestCells[0].find(c => map[c[0]][c[1]] === '-');
}

const solve = (map) => {
    console.log(map);
    const cell = getBestMove(map);
    if (cell) {
        map[cell[0]][cell[1]] = MY;
    }
    else {
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
                if (map[y][x] === '-') {
                    map[y][x] = MY;
                    return map;
                }
            }
        }
    }
    console.log(map);
    return map;
}

const ifWin = (map) => {

    for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        if (map[a[0]][a[1]] != '-' && map[a[0]][a[1]] && map[a[0]][a[1]] === map[b[0]][b[1]] && map[a[0]][a[1]] === map[c[0]][c[1]]) {
            return { winner: map[a[0]][a[1]] };
        }
    }
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            if (map[y][x] == '-') return { winner: null };
        }
    }
    return { winner: '-' };
}

module.exports = { solve, ifWin };