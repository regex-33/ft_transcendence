module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('MESSAGE', 'FRIEND_REQUEST'),
      allowNull: false,
    },
    readed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });

  return Notification;
};
