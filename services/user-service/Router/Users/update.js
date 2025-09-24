const db = require("../../models/");
const { User } = db;
const checkAuthJWT = require("../../util/checkauthjwt");
const multer = require("../../util/Multer");
const bcrypt = require("bcrypt");
const { logger } = require("../../util/logger");
const valid = require("../../util/validaters");
const update = async (req, res) => {
  const { check, payload } = await checkAuthJWT(req, res);
  if (check) return check;
  req.user = payload;
  try {
    req.body = await multer(req);
  } catch (error) {
    require(`${process.env.PROJECT_PATH}/util/catch`)(error);
  }
  if (req.body.username)
    await updateUser(req, res, payload);
  if (req.body.email)
    await updateEmail(req, res, payload);
  if (req.body.location)
    await updateLocation(req, res, payload);
  if (req.body.bio)
    await updateBio(req, res, payload);
  if (req.body.birthday)
    await updateBirthday(req, res, payload);
  if (req.body.avatar)
    await updateAvatar(req, res, payload);
  res.send({ message: "User updated successfully." });
}

const updateLocation = async (req, res, payload) => {

  const { id } = payload;
  const { location } = req.body;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
    user.location = location;

    await user.save();
  } catch (err) {
    require(`${process.env.PROJECT_PATH}/util/catch`)(err);
  }
};

const updateBirthday = async (req, res, payload) => {
  const { id } = payload;
  const { birthday } = req.body;

  try {
    if (/^\d+\/\d+\/\d+$/.test(birthday)) {
    } else {
      return res.status(400).send({ "error": "bad date format." })
    }
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
    user.birthday = birthday;

    await user.save();
  } catch (err) {
    require(`${process.env.PROJECT_PATH}/util/catch`)(err);
    res.status(500).send({ error: "Internal server error." });
  }
}

const updateUser = async (req, res, payload) => {
  const { id } = payload;
  const { username } = req.body;
  if (!valid.usernamevalid(username)) {
    return res.status(400).send({
      error: "Invalid username format.",
    });
  }

  try {
    const user = await User.findByPk(id);
    const user2 = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
    if (user2) {
      return res.status(409).send({ error: "Username already exists." });
    }
    user.username = username;

    await user.save();
    logger(req, "INFO", "updateUserName", username, true, null, req.cookies?.token || null);
  } catch (err) {
    require(`${process.env.PROJECT_PATH}/util/catch`)(err);
    res.status(500).send({ error: "Internal server error." });
  }
};
const updateEmail = async (req, res, payload) => {
  const { id } = payload;
  const { email } = req.body;
  if (!valid.emailvalid(email)) {
    return res.status(400).send({
      error: "Invalid email format.",
    });
  }

  try {
    const user = await User.findByPk(id);
    const user2 = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
    if (user2) {
      return res.status(409).send({ error: "Email already exist." });
    }
    user.email = email;

    await user.save();
    logger(req, "INFO", "updateEmail", payload.username, true, null, req.cookies?.token || null);
  } catch (err) {
    require(`${process.env.PROJECT_PATH}/util/catch`)(err);
    res.status(500).send({ error: "Internal server error." });
  }
};
// // username edit , email edit, password edit , avatar edit,  bio edit
const updatePassword = async (req, res) => {
  const { check, payload } = await checkAuthJWT(req, res);
  if (check) return check;
  const { id } = payload;
  const { password } = req.body;
  if (!valid.passwordvalid(password)) {
    return res.status(400).send({
      error: "Invalid password format.",
    });
  }

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
    user.password = bcrypt.hashSync(password, 10);

    await user.save();
    logger(req, "INFO", "updatePassword", payload.username, true, null, req.cookies?.token || null);
    res.send({ message: "User updated successfully." });
  } catch (err) {
    require(`${process.env.PROJECT_PATH}/util/catch`)(err);
    res.status(500).send({ error: "Internal server error." });
  }
};

const updateAvatar = async (req, res, payload) => {
  const { id } = payload;
  try {
    const { avatar } = req.body;
    if (!avatar || !avatar.path) {
      return res.status(400).send({
        error: "Avatar file is required.",
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
    user.avatar = avatar.path;

    await user.save();
    logger(req, "INFO", "updateAvatar", payload.username, true, null, req.cookies?.token || null);
  } catch (err) {
    require(`${process.env.PROJECT_PATH}/util/catch`)(err);
    res.status(500).send({ error: "Internal server error." });
  }
};

const updateBio = async (req, res, payload) => {
  const { id } = payload;
  const { bio } = req.body;
  if (bio && bio.length > 500) {
    return res.status(400).send({
      error: "Bio must be less than 500 characters long.",
    });
  }

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
    user.bio = bio;

    await user.save();
    logger(req, "INFO", "updateBio", payload.username, true, null, req.cookies?.token || null);
  } catch (err) {
    require(`${process.env.PROJECT_PATH}/util/catch`)(err);
    res.status(500).send({ error: "Internal server error." });
  }
};

module.exports = { updatePassword, update };
