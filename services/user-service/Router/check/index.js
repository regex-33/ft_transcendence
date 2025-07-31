const checkAuthJWT = require("../util/checkauthjwt");

module.exports = (req,res) => {
    const check = checkAuthJWT(req, res);
    if (check) {
        return check;
    }
    return res.status(200).send({});
}