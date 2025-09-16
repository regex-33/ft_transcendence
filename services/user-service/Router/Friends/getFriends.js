const db = require("../../models");
const checkAuthJWT = require("../../util/checkauthjwt");
const { Op } = require("sequelize");

const getFriends = async (request, reply) => {
  const { check, payload } = await checkAuthJWT(request, reply);
  if (check) return check;
  request.user = payload;
  const userId = request.user.id;

  try {
    const relations = await db.Relationship.findAll({
      where: {
        status: "friend",
        [Op.or]: [
          { userId: userId },
          { otherId: userId }
        ]
      }
    });

    if (!relations || relations.length === 0) {
      return reply.send([]);
    }

    const friendIds = [...new Set(relations.map(rel => (rel.userId === userId ? rel.otherId : rel.userId)))];

    const users = await db.User.findAll({
      where: {
        id: friendIds
      },
      include: [
        {
          model: db.Session,
          as: 'sessions',
          attributes: ['counter']
        }
      ],
      attributes: ["id", "username", "avatar", "online"]
    });
    const new_friends = users.map(friend => {
      return ({
        id: friend.id,
        username: friend.username,
        avatar: friend.avatar,
        online: friend.sessions?.filter(session => session.counter > 0).length > 0
      });
    });
    reply.send(new_friends || { new_friends: [] });
  } catch (error) {
    console.error("Error fetching friends:", error);
    reply.status(500).send({ error: "Internal Server Error" });
  }
};


const getPendingFriends = async (request, reply) => {
  const { check, payload } = await checkAuthJWT(request, reply);
  if (check) return check;
  request.user = payload;
  const userId = request.user.id;

  try {
    const pendingFriends = await db.Relationship.findAll({
      where: {
        status: "pending",
        otherId: userId
      }
    });
    if (!pendingFriends || pendingFriends.length === 0) {
      return reply.send([]);
    }
    const friends = await Promise.all(pendingFriends.map(async (relation) => {
      const user = await db.User.findOne({
        where: {
          id: relation.userId
        },
        include: [
          {
            model: db.Session,
            as: 'sessions',
            attributes: ['counter']
          }
        ],
        attributes: ["id", "username", "avatar", "online"]
      });
      let new_user = user.toJSON();
      return {
        id: new_user.id,
        username: new_user.username,
        avatar: new_user.avatar,
        online: new_user.sessions?.filter(session => session.counter > 0).length > 0
      };
    }));
    reply.send(friends || { friends: [] });
  } catch (error) {
    console.error("Error fetching friends:", error);
    reply.status(500).send({ error: "Internal Server Error" });
  }
};


const getRequestedFriends = async (request, reply) => {
  const { check, payload } = await checkAuthJWT(request, reply);
  if (check) return check;
  request.user = payload;
  const userId = request.user.id;

  try {
    const friends = await db.User.findOne({
      where: {
        id: userId,
      },
      attributes: [],
      include: [
        {
          model: db.User,
          as: "other",
          attributes: ["id", "username", "avatar", "online"],
          include: [{
            model: db.Session,
            as: 'sessions',
            attributes: ['counter']
          }],
          through: {
            where: { status: "pending", userId },
          },
        },

      ],
    });
    const new_friends = friends.other.map(friend => {
      return ({
        id: friend.id,
        username: friend.username,
        avatar: friend.avatar,
        online: friend.sessions?.filter(session => session.counter > 0).length > 0
      });
    });
    reply.send(new_friends || { new_friends: [] });
  } catch (error) {
    console.error("Error fetching friends:", error);
    reply.status(500).send({ error: "Internal Server Error" });
  }
};

const getBlockedUsers = async (request, reply) => {
  const { check, payload } = await checkAuthJWT(request, reply);
  if (check) return check;
  request.user = payload;
  const userId = request.user.id;

  try {
    const friends = await db.User.findOne({
      where: {
        id: userId,
      },
      attributes: [],
      include: [
        {
          model: db.User,
          as: "other",
          attributes: ["id", "username", "avatar", "online"],
          include: [{
            model: db.Session,
            as: 'sessions',
            attributes: ['counter']
          }],
          through: {
            where: { status: "blocked", userId: userId },
          },
        },
      ],
    });
    const new_friends = friends.other.map(friend => {
      return ({
        id: friend.id,
        username: friend.username,
        avatar: friend.avatar,
        online: friend.sessions?.filter(session => session.counter > 0).length > 0
      });
    });
    reply.send(new_friends || { new_friends: [] });
  } catch (error) {
    console.error("Error fetching friends:", error);
    reply.status(500).send({ error: "Internal Server Error" });
  }
};


module.exports = {
  getFriends,
  getPendingFriends,
  getRequestedFriends,
  getBlockedUsers
};
