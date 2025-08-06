module.exports = (sequelize, DataTypes) => {
    const MatchUser = sequelize.define("MatchUser", {
        team: {
            type: DataTypes.ENUM("RED", "BLUE"),
            allowNull: false,
        },
    });
    return MatchUser;
};
