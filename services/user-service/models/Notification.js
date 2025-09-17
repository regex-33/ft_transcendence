module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('FRIEND_REQUEST', 'MATCH_NOTIFICATION'),
      allowNull: false,
      defaultValue: 'FRIEND_REQUEST',
    },
    notifierId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    gameId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    readed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });
  Notification.associate = (models) => {
    Notification.belongsTo(models.User, { foreignKey: 'notifierId', onDelete: 'CASCADE' });
  }
  return Notification;
};