const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
module.exports = async (req, reply) => {
  const redirectURL = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}`;
  reply.redirect(redirectURL);
};
