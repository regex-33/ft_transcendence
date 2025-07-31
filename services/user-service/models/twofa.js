module.exports = (sequelize, DataTypes) => {
  const TwoFA = sequelize.define("TwoFA", {
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    secret: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });

  return TwoFA;
}
