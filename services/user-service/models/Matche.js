const { time } = require("speakeasy");


module.exports = (sequelize, DataTypes) => {
    const Matche = sequelize.define("Matche", {
        score1: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        score2: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        time: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: new Date(),
        },
        type: {
            type: DataTypes.ENUM("CLASSIC", "VANISH", "SPEED","GOLD"),
            allowNull: false,
            defaultValue: "CLASSIC",
        },
        status:{
            type: DataTypes.ENUM("LIVE", "LOCKED"),
            allowNull: false,
            defaultValue: "LIVE",
        }
    });
    Matche.associate = (models) => {
        models.User.belongsToMany(Matche, { through: 'MatchUser' });
        Matche.belongsToMany(models.User, { through: 'MatchUser' });
    };
    return Matche;
};