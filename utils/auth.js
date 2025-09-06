function checkAdmin(req, res, next) {
  const { username, password } = req.body;

  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    return next();
  } else {
    return res.status(401).json({ success: false, message: "管理員帳密錯誤！" });
  }
}

module.exports = { checkAdmin };
