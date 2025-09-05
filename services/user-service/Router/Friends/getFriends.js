const db = require("../../models");
const checkAuthJWT = require("../../util/checkauthjwt");
const { fillObject } = require("../../util/logger");

const getFriends = async (request, reply) => {
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
            where: { status: "friend" },
          },
        },
      ],
    });
    fillObject(
      request,
      "INFO",
      "getFriends",
      userId,
      true,
      "",
      request.cookies?.token || null
    );
    console.log("Fetched friends:", friends.other.id);
    const new_friends = friends.other.map(friend => {
      return ({
        id: friend.id,
        username: friend.username,
        avatar: friend.avatar,
        online: friend.sessions?.filter(session => session.counter > 0).length > 0
      });
    });
    console.log("Mapped friends:", new_friends);
    reply.send(new_friends || { new_friends: [] });
  } catch (error) {
    fillObject(
      request,
      "ERROR",
      "getFriends",
      userId,
      false,
      error.message,
      request.cookies?.token || null
    );
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
    fillObject(
      request,
      "INFO",
      "getFriends",
      userId,
      true,
      "",
      request.cookies?.token || null
    );
    reply.send(friends || { friends: [] });
  } catch (error) {
    fillObject(
      request,
      "ERROR",
      "getFriends",
      userId,
      false,
      error.message,
      request.cookies?.token || null
    );
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
    fillObject(
      request,
      "INFO",
      "getFriends",
      userId,
      true,
      "",
      request.cookies?.token || null
    );
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
    fillObject(
      request,
      "ERROR",
      "getFriends",
      userId,
      false,
      error.message,
      request.cookies?.token || null
    );
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
    fillObject(
      request,
      "INFO",
      "getFriends",
      userId,
      true,
      "",
      request.cookies?.token || null
    );
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
    fillObject(
      request,
      "ERROR",
      "getFriends",
      userId,
      false,
      error.message,
      request.cookies?.token || null
    );
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
