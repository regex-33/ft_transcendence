module.exports = (sequelize, DataTypes) => {
  const ResetCode = sequelize.define("ResetCode", {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  return ResetCode;
};
