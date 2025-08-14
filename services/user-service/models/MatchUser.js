module.exports = (sequelize, DataTypes) => {
  return sequelize.define('MatchUser', {
    team: DataTypes.STRING
  });
};