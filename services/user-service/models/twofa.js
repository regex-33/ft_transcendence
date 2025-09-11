module.exports = (sequelize, DataTypes) => {
  const TwoFA = sequelize.define("TwoFA", {
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    secret: {
      type: DataTypes.STRING,
      allowNull: false
    },
    verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false  // new field to track verification status
    }
  });

  return TwoFA;
};
