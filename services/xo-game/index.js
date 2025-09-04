const fastify = require('fastify')({ logger: true })
const MY = 'O';
const solve = (map) => {
    map[0][0].value = 'O';
    return map;
}

const ifWin = (map) => {
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

    for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        if (map[a[0]][a[1]].value && map[a[0]][a[1]].value === map[b[0]][b[1]].value && map[a[0]][a[1]].value === map[c[0]][c[1]].value) {
            return { winner: map[a[0]][a[1]].value };
        }
    }

    return { winner: null };
}


fastify.post('/xo-game/cell', async (request, reply) => {
    const { map } = request.body;
    console.table(request.body);
    return { map: solve(map) };
})

fastify.listen({ port: 8083, host: '0.0.0.0' })
    .then(address => {
        console.log(`Server listening at ${address}`)
    })
    .catch(err => {
        fastify.log.error(err)
        process.exit(1)
    })
