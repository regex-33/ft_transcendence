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
          as: "friends",
          attributes: ["id", "username", "avatar", "email", "bio"],
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


const getPendingFriends = async (request, reply) => {
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
          as: "friends",
          attributes: ["id", "username", "avatar", "email", "bio"],
          through: {
            where: { status: "pending", otherId: userId },
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
          as: "friends",
          attributes: ["id", "username", "avatar", "email", "bio"],
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
          as: "friends",
          attributes: ["id", "username", "avatar", "email", "bio"],
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


module.exports = {
  getFriends,
  getPendingFriends,
  getRequestedFriends,
  getBlockedUsers
};
