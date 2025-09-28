const usernamevalid = (username) => {
    const regex = /^[a-zA-Z0-9_.]{3,30}$/;
    return username && typeof username === "string" && regex.test(username);
}

const emailvalid = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9.-]{1,255}\.[a-zA-Z]{2,}$/;
    return email && typeof email === "string" && regex.test(email);
}

const passwordvalid = (password) => {
    const regex = /^.{6,}$/;
    return password && typeof password === "string" && regex.test(password);
}

module.exports = { usernamevalid, emailvalid, passwordvalid };