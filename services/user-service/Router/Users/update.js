const db = require("../../models/");
const { User } = db;
const checkAuthJWT = require("../../util/checkauthjwt");
const multer = require("../../util/Multer");
const bcrypt = require("bcrypt");
const { fillObject } = require("../../util/logger");

// const validation = (res, ...inputs) => {
//   const [id, email, password, avatar, username] = inputs;

//   if (
//     email === undefined &&
//     password === undefined &&
//     avatar === undefined &&
//     username === undefined
//   ) {
//     return res
//       .status(400)
//       .send({ error: "At least one field must be provided for update." });
//   }

//   if (!/^\d+$/.test(id)) {
//     return res.status(400).send({ error: "Invalid user ID format." });
//   }

//   if (username && !/^[a-zA-Z_]+$/.test(username)) {
//     return res.status(400).send({
//       error: "Username must contain only letters, numbers, and underscores.",
//     });
//   }

//   if (email && !email.includes("@")) {
//     return res.status(400).send({ error: "Invalid email format." });
//   }

//   return null;
// };



// // /**
// // * update user info
// const updateUser = async (req, res) => {
//   const { check, payload } = await checkAuthJWT(req, res);
//   if (check) return check;
//   req.user = payload;
//   const { id } = req.user;
//   try {
//     const body = await multer(req)
//     const { username, email, password, avatar, bio } = body;
//     if (id != req.user.id) {
//       return res
//         .status(403)
//         .send({ error: "You are not authorized to update this user." });
//     }

//     const validationError = validation(
//       res,
//       id,
//       email,
//       password,
//       avatar ? avatar.path : undefined,
//       username
//     );

//     if (validationError) {
//       fillObject(req, "WARNING", "updateUser", id, false, validationError.message, req.cookies?.token || null);
//       return validationError;
//     }

//     try {
//       const user = await User.findByPk(id)
//       if (!user) {
//         fillObject(req, "WARNING", "updateUser", id, false, "User not found.", req.cookies?.token || null);
//         return res.status(404).send({ error: "User not found." });
//       }

//       const updatedData = {};
//       if (email) updatedData.email = email;
//       if (password) updatedData.password = bcrypt.hashSync(password, 10);
//       if (avatar) updatedData.avatar = avatar.path ? avatar.path : null;
//       if (username) updatedData.username = username;
//       try {
//         await user
//           .update(updatedData);
//         res.send({
//           message: "User updated successfully.",
//         });
//       }
//       catch (err) {
//         fillObject(req, "ERROR", "updateUser", id, false, err.message, req.cookies?.token || null);
//         console.error("Error updating user:", err);
//         res.status(500).send({ error: "Internal server error." });
//       };
//     }
//     catch (err) {
//       fillObject(req, "ERROR", "updateUser", id, false, err.message, req.cookies?.token || null);
//       console.error("Error fetching user:", err);
//       res.status(500).send({ error: "Internal server error." });
//     };
//   }
//   catch (err) {
//     fillObject(req, "ERROR", "updateUser", "unknown", false, err.message, req.cookies?.token || null);
//     console.error("Error processing multipart request:", err);
//     res.status(500).send({ error: "Internal server error." });
//   };
// };

const updateUser = async (req, res) => {
  const { check, payload } = await checkAuthJWT(req, res);
  if (check) return check;
  const { id } = payload;
  const { username } = req.body;
  if (!username || !(/^[A-Za-z]+$/.test(username)) || username.length <= 2) {
    return res.status(400).send({
      error: "Username must contain only letters and be at least 3 characters long.",
    });
  }

  try {
    const user = await User.findByPk(id);
    const user2 = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
    if (user2) {
      return res.status(409).send({ error: "Username already taken." });
    }
    user.username = username;

    await user.save();
    res.send({ message: "User updated successfully." });
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
      return res.status(409).send({ error: "Email already taken." });
    }
    user.email = email;

    await user.save();
    res.send({ message: "User updated successfully." });
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
    const body = await multer(req)
    const { avatar } = body;
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
    res.send({ message: "User updated successfully." });
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
    res.send({ message: "User updated successfully." });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).send({ error: "Internal server error." });
  }
};

module.exports = { updateUser, updateEmail, updatePassword, updateAvatar, updateBio };
