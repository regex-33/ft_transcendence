module.exports = (sequelize, DataTypes) => {
  const Relationship = sequelize.define(
    "Relationship",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      status: {
        type: DataTypes.ENUM("pending", "friend", "blocked"),
        allowNull: false,
        defaultValue: "pending",
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      otherId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      }
    }
  );
  
  return Relationship;
};
