const db = require("../../models");
const bcrypt = require("bcrypt");
const checkAuthJWT = require("../../util/checkauthjwt");

const changePassword = async (req, res) => {
  try {
    const { check, payload } = await checkAuthJWT(req, res);
    if (check) return check;
    const { id } = payload;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).send({ error: "Current password and new password are required" });
    }
    const user = await db.User.findOne({ where: { id } });
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).send({ error: "Current password is incorrect" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();
    res.status(200).send({ message: "Password changed successfully" });
  } catch (err) {
    require(`${process.env.PROJECT_PATH}/util/catch`)(err);
    res.status(500).send({ error: "Internal server error" });
  }
};

module.exports = {
  changePassword,
};
