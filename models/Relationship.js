module.exports = (sequelize, DataTypes) => {
  const Relationship = sequelize.define(
    "Relationship",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      first: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      second: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "accepted", "rejected", "blocked"),
        allowNull: false,
        defaultValue: "pending",
      },
    }
  );
  return Relationship;
};
