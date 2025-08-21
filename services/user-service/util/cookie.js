module.exports = (reply,token) => {
  reply.setCookie("token", token, {
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
  });
  return reply;
}
