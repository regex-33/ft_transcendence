module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('FRIEND_REQUEST', 'MATCH_NOTIFICATION'),
      allowNull: false,
    },
    notid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    readed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });

  return Notification;
};