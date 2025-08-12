const { on } = require("nodemailer/lib/xoauth2");

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
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      identifier: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "without",
      },
      leveltype: {
        type: DataTypes.ENUM("CLASSIC", "VANISH", "SPEED", "GOLD"),
        allowNull: false,
        defaultValue: "CLASSIC",
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      friends: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      online: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      valid: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      type: {
        type: DataTypes.ENUM("CLASSIC", "VANISH", "SPEED", "GOLD"),
        allowNull: false,
        defaultValue: "CLASSIC",
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "__",
      }
    },
    {
      tableName: "users",
    }
  );

  return User;
};
