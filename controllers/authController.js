const User = require("../models/User");
const bcrypt = require("bcrypt");

exports.getSignup = (req, res) => {
  res.render("auth/signup", { error: null });
};

exports.postSignup = async (req, res) => {
  const { name, email, password } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.render("auth/signup", { error: "Email already exists" });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hashed, role: "player" });
  await user.save();
  res.redirect("/auth/login");
};

exports.getLogin = (req, res) => {
  res.render("auth/login", { error: null });
};

exports.postLogin = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await bcrypt.compare(password, user.password))) {
    req.session.user = user;
    return res.redirect("/");
  }
  res.render("auth/login", { error: "Invalid credentials" });
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
};
