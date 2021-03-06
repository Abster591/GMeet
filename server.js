require("dotenv").config();
const express = require("express");
const app = express();
const { v4: uuidV4 } = require("uuid");
const passport = require("passport");
const session = require("express-session");
const nodeSchedule = require("node-schedule");

const authRoutes = require("./auth/authRoutes.js");

const dateTime = require("./util/getDateTime.js");

const server = require("http").Server(app);

const users = {};

const roomBoard = {};

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
app.use(express.json());
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
app.get("/close", (req, res) => {
  res.redirect("/");
});

app.post("/", isLoggedIn, (req, res) => {
  const { link } = req.body;
  res.redirect(`/${link}`);
});

app.get("/new_meet", isLoggedIn, (req, res) => {
  const new_room_id = uuidV4();
  res.redirect(`/${new_room_id}`);
});

app.get("/schedule", isLoggedIn, (req, res) => {
  res.render("schedule", {
    username: req.user.displayName,
    useremail: req.user.emails[0].value,
  });
});

const sendMail = require("./util/sendMail.js");
app.post("/schedule", (req, res) => {
  let {
    organiserName,
    organiserEmail,
    meetingTitle,
    meetingDateTime,
    meetingDescription,
    participantEmails,
  } = req.body;

  participantEmails.push(organiserEmail);
  const meetingId = uuidV4();

  const meetingDate = new Date(meetingDateTime);

  meetingDateTime =
    meetingDate.toLocaleTimeString() + " " + meetingDate.toLocaleDateString();

  const dateToSendMail = new Date(meetingDate - 15 * 60 * 1000);

  if (dateToSendMail <= Date.now()) {
    sendMail(
      organiserName,
      organiserEmail,
      meetingTitle,
      meetingDateTime,
      meetingDescription,
      participantEmails,
      meetingId
    );
  } else {
    console.log(`mail will be sent at ${dateToSendMail}`);
    nodeSchedule.scheduleJob(dateToSendMail, () => {
      sendMail(
        organiserName,
        organiserEmail,
        meetingTitle,
        meetingDateTime,
        meetingDescription,
        participantEmails,
        meetingId
      );
    });
  }

  res.redirect("/");
});

app.use("/auth", authRoutes);

app.get("/error", (req, res) => {
  res.send("something went wrong :(");
});

app.get("/:roomId", isLoggedIn, (req, res) => {
  res.render("call", {
    roomId: req.params.roomId,
    username: req.user.displayName,
    isAdmin: users[req.params.roomId] ? "false" : "true",
  });
});

const io = require("socket.io")(server);

const port = process.env.PORT;
server.listen(port, () => console.log(`Listening on port ${port}`));

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, username) => {
    const newUser = {
      id: userId,
      name: username,
    };
    if (users[roomId]) {
      users[roomId].push(newUser);
    } else {
      users[roomId] = new Array(newUser);
    }

    socket.join(roomId);

    io.to(roomId).emit("participant-list-updated", users[roomId]);

    socket.to(roomId).emit("user-connected", userId);

    socket.on("disconnect", () => {
      users[roomId] = users[roomId].filter(({ id }) => id != userId);
      socket.to(roomId).emit("user-disconnected", userId, users[roomId]);
    });
  });
  socket.on("chat", (data) => {
    socket.to(data.roomId).emit("chat", data);
  });
  socket.on("removeVideo", (data) => {
    socket.to(data.roomId).emit("removeVideo", data);
  });
  socket.on("videoAdmin", (data) => {
    socket.to(data.roomId).emit("videoAdmin", data);
  });
  socket.on("removeAudio", (data) => {
    socket.to(data.roomId).emit("removeAudio", data);
  });
  socket.on("audioAdmin", (data) => {
    socket.to(data.roomId).emit("audioAdmin", data);
  });
  socket.on("removeUser", (data) => {
    socket.to(data.roomId).emit("removeUser", data);
  });
  socket.on("getCanvas", (roomId) => {
    if (roomBoard[roomId])
      socket.to(roomId).emit("getCanvas", roomBoard[roomId]);
  });
  socket.on("storeCanvas", (url, roomId) => {
    roomBoard[roomId] = url;
  });
  socket.on("clearBoard", (roomId) => {
    socket.to(roomId).emit("clearBoard");
  });
  socket.on("draw", (newX, newY, x, y, color, drawSize, roomId) => {
    socket.to(roomId).emit("draw", newX, newY, x, y, color, drawSize);
  });
});
