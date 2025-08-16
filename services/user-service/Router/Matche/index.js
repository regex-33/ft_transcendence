const checkAuthJWT = require('../../util/checkauthjwt');
const db = require('../../models');
module.exports = {
    ...require('./getters'),
    ...require('./create'),
    ...require('./update'),
};