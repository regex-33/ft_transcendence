const db = require("../../models/");
const { User } = db;
const checkAuthJWT = require("../../util/checkauthjwt");
const multer = require("../../util/Multer");
const bcrypt = require("bcrypt");
const { logger } = require("../../util/logger");

const update = async (req, res) => {
  const { username, email, location, bio, birthday, avatar } = await multer(req);
  req.body = {
    username,
    email,
    location,
    bio,
    birthday,
    avatar
  };
  if (username)
    await updateUser(req, res);
  if (email)
    await updateEmail(req, res);
  if (location)
    await updateLocation(req, res);
  if (bio)
    await updateBio(req, res);
  if (birthday)
    await updateBirthday(req, res);
  if (avatar)
    await updateAvatar(req, res);
  res.send({ message: "User updated successfully." });
}

const updateLocation = async (req, res) => {
  const { check, payload } = await checkAuthJWT(req, res);
  if (check) return check;
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
    console.error("Error updating user:", err);
  }
};

const updateBirthday = async (req, res) => {
  const { check, payload } = await checkAuthJWT(req, res);
  if (check) return check;
  const { id } = payload;
  const { birthday } = req.body;

  try {
    if (/^\d+\/\d+\/\d+$/.test(birthday)) {
    } else {
      return res.status(400).send({"error":"bad date format."})
    }
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
    user.birthday = birthday;

    await user.save();
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).send({ error: "Internal server error." });
  }
}

const updateUser = async (req, res) => {
  const { check, payload } = await checkAuthJWT(req, res);
  if (check) return check;
  const { id } = payload;
  const { username } = req.body;
  if (!username || username.length <= 2) {
    return res.status(400).send({
      error: "Username must be at least 3 characters long.",
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
    console.error("Error updating user:", err);
    res.status(500).send({ error: "Internal server error." });
  }
};
const updateEmail = async (req, res) => {
  const { check, payload } = await checkAuthJWT(req, res);
  if (check) return check;
  const { id } = payload;
  const { email } = req.body;
  if (!email || !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) || email.length <= 2) {
    return res.status(400).send({
      error: "Invalid email format or too short.",
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
    console.error("Error updating user:", err);
    res.status(500).send({ error: "Internal server error." });
  }
};
// // username edit , email edit, password edit , avatar edit,  bio edit
const updatePassword = async (req, res) => {
  const { check, payload } = await checkAuthJWT(req, res);
  if (check) return check;
  const { id } = payload;
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).send({
      error: "Password must be at least 6 characters long.",
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
    console.error("Error updating user:", err);
    res.status(500).send({ error: "Internal server error." });
  }
};

const updateAvatar = async (req, res) => {
  const { check, payload } = await checkAuthJWT(req, res);
  if (check) return check;
  const { id } = payload;
  try {
    const { avatar } = req.body;
    console.log(avatar);
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
    console.error("Error updating user:", err);
    res.status(500).send({ error: "Internal server error." });
  }
};

const updateBio = async (req, res) => {
  const { check, payload } = await checkAuthJWT(req, res);
  if (check) return check;
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
    console.error("Error updating user:", err);
    res.status(500).send({ error: "Internal server error." });
  }
};

module.exports = { updatePassword, update };
