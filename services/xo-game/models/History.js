
const history = (s, d) => {
    return s.define('History', {
        win: {
            type: d.BOOLEAN,
            defaultValue: false,
        },
        player: {
            type: d.INTEGER,
            allowNull: false
        },
        map_: {
            type: d.STRING,
            defaultValue: '[["-","-","-"],["-","-","-"],["-","-","-"]]',
            allowNull: true
        },
        finished: { type: d.BOOLEAN, defaultValue: false }
    });
}

module.exports = history