module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      identifier: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      friends: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "__",
      },
    },
    {
      tableName: "users",
    }
  );

  return User;
};
