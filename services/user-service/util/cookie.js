module.exports = (reply,token) => {
  reply.setCookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
  });
  return reply;
}