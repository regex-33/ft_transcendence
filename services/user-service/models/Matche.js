

module.exports = (sequelize, DataTypes) => {
    const Matche = sequelize.define("Matche", {
        type: {
            type: DataTypes.ENUM("CLASSIC", "VANISH", "SPEED","GOLD"),
            allowNull: false,
            defaultValue: "CLASSIC",
        },
        status:{
            type: DataTypes.ENUM("LIVE", "FINISHED"),
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