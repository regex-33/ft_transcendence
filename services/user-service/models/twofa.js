module.exports = (sequelize, DataTypes) => {
  const TwoFA = sequelize.define("TwoFA", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    secret: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  });

  return TwoFA;
};

