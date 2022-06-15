require("dotenv").config();
const express = require("express");
const app = express();
const { v4: uuidV4 } = require("uuid");
const passport = require("passport");
const session = require("express-session");

const authRoutes = require("./auth/authRoutes.js");

const dateTime = require("./util/getDateTime.js");

const server = require("http").Server(app);

const isLoggedIn = (req, res, next) => {
  req.user ? next() : res.redirect("/auth/google");
};

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  username = req.user ? req.user.displayName : "";
  const dateInfo = dateTime();
  res.render("home", {
    username: username,
    date: dateInfo,
  });
});

app.post("/", isLoggedIn, (req, res) => {
  const { link } = req.body;
  res.redirect(`/${link}`);
});

app.get("/new_meet", isLoggedIn, (req, res) => {
  const new_room_id = uuidV4();
  res.redirect(`/${new_room_id}`);
});

app.use("/auth", authRoutes);

app.get("/error", (req, res) => {
  res.send("something went wrong :(");
});

app.get("/:roomId", isLoggedIn, (req, res) => {
  res.render("call", {
    roomId: req.params.roomId,
    username: req.user.displayName,
  });
});

const io = require("socket.io")(server);

const port = process.env.PORT;
server.listen(port, () => console.log(`Listening on port ${port}`));

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);
  });
  socket.on("chat", function (data) {
    socket.to(data.roomId).emit("chat", data);
  });
});
