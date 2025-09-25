
const history = (s, d) => {
    return s.define('History', {
        win: {
            type: d.INTEGER,
            defaultValue: 0
        },
        player: {
            type: d.INTEGER,
            allowNull: false
        },
        opponent: {
            type: d.INTEGER,
            allowNull: true
        },
        map_: {
            type: d.STRING,
            defaultValue: '[["-","-","-"],["-","-","-"],["-","-","-"]]',
            allowNull: true
        },
        turn: d.INTEGER,
        finished: { type: d.BOOLEAN, defaultValue: false }
    });
}

module.exports = history