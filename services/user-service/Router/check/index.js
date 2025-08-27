const checkAuthJWT = require("../../util/checkauthjwt");

module.exports = async (req, res) => {
    const { check } = await checkAuthJWT(req, res);
    if (check) return check;
    return res.status(200).send({ id: req.user.id });
}