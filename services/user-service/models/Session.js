const session = (sequelize, DataTypes) => {
    const Session = sequelize.define('Session', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        SessionId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        counter: {
            type: DataTypes.INTEGER,
            defaultValue:  0,
        }
    }, {
        tableName: 'sessions',
        timestamps: true,
    })

    return Session
}

module.exports = session