module.exports = (sequelize, DataTypes) => {
  const Relationship = sequelize.define(
    "Relationship",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      creator:{
        type: DataTypes.INTEGER,
        allowNull: false,
      }
      ,
      from: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      to: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "friend", "blocked"),
        allowNull: false,
        defaultValue: "pending",
      },
    }
  );
  return Relationship;
};
