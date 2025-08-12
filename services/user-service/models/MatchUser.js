module.exports = (sequelize, DataTypes) => {
    const MatchUser = sequelize.define("MatchUser", {
        team: {
            type: DataTypes.ENUM("team1", "team2"),
            allowNull: false,
        },
    });
    return MatchUser;
};
