const socket = io("/");
console.log(ROOM_ID, username, isAdmin);
console.log(isAdmin === "true");
const chats = document.querySelector(".chats");
const senders = [];
const peers = {};
let myId = null;
let mediaRecorder;
let currentlyRecording = false;
let recordStream;
let timer = document.createElement("span");
timer.style.textAlign = "right";
let int = null;
let [seconds, minutes, hours] = [0, 0, 0];
let showingBoard = false;
const whiteBoard = document.getElementById("white-board");
whiteBoard.style.display = "none";
const canvas = document.getElementById("canvas");

const screenShare = document.getElementById("screenShare");
const peer = new Peer(undefined, {
  host: "/",
  port: "3001",
});

const createParticipants = (users) => {
  const participantList = document.getElementById("participant__list");
  participantList.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    li.className += "px-5 py-2 flex items-center shadow-sm";
    console.log(isAdmin);
    if (isAdmin === "true" && user.id !== myId) {
      li.innerHTML = `<i class="fa-solid fa-user"></i><span class="text-base ml-5">${
        user.name
      } </span>
    <button class="ml-auto rounded-full px-5 py-2 hover:bg-slate-100 transition-all" style="border-radius:50%;" id=${
      user.id
    }><i class="fa-solid fa-ellipsis-vertical ml-auto"></i></button>
    <span class="icon btn-icon-admin-disable" id =${
      user.id + "#s"
    } style="display:none;"><button id = ${
        user.id + "#"
      }><i class="fa-solid fa-microphone-slash ml-auto"></i></button></span>
    <span class="icon btn-icon-admin" id=${
      user.id + "$s"
    } style ="display:none"><button id = ${
        user.id + "$"
      }><i class="fa-solid fa-video ml-auto"></i></button></span>
    <span class="icon btn-icon-admin-disable" id =${
      user.id + "%s"
    } style = "display:none"><button id = ${
        user.id + "%"
      }><i class="fa-solid fa-phone-slash ml-auto"></i></button></span>`;
    } else {
      li.innerHTML = `<i class="fa-solid fa-user"></i><span class="text-base ml-5">${user.name} </span>`;
    }
    li.setAttribute("id", user.id);
    li.setAttribute("userid", user.id);
    participantList.appendChild(li);
  });
  if (isAdmin === "true") {
    users.forEach((user) => {
      if (user.id !== myId) {
        document.getElementById(`${user.id}`).addEventListener("click", () => {
          if (
            document.getElementById(`${user.id}$s`).style.display === "none"
          ) {
            document.getElementById(`${user.id}$s`).style.display = "";
            document.getElementById(`${user.id}#s`).style.display = "";
            document.getElementById(`${user.id}%s`).style.display = "";
          } else {
            document.getElementById(`${user.id}$s`).style.display = "none";
            document.getElementById(`${user.id}#s`).style.display = "none";
            document.getElementById(`${user.id}%s`).style.display = "none";
          }
        });
        document
          .getElementById(`${user.id}$`)
          .addEventListener("click", (e) => {
            socket.emit("removeVideo", {
              id: user.id,
              roomId: ROOM_ID,
            });
            document.getElementById(`${user.id}`).click();
          });
        document.getElementById(`${user.id}#`).addEventListener("click", () => {
          socket.emit("removeAudio", {
            id: user.id,
            roomId: ROOM_ID,
          });
          document.getElementById(`${user.id}`).click();
        });
        document.getElementById(`${user.id}%`).addEventListener("click", () => {
          socket.emit("removeUser", {
            id: user.id,
            roomId: ROOM_ID,
          });
          document.getElementById(`${user.id}`).click();
        });
      }
    });
  }
};
socket.on("participant-list-updated", (users) => {
  createParticipants(users);
});
socket.on("removeVideo", (data) => {
  if (data.id === myId) toggleVideo();
});
socket.on("removeAudio", (data) => {
  if (data.id === myId) toggleAudio();
});
socket.on("removeUser", (data) => {
  if (data.id === myId) document.getElementById("closeCall").click();
});
const removeParticipant = (id) => {
  const participant = document.querySelector(`[userid="${id}"]`);
  participant.remove();
};

const displayMsg = () => {
  const block = document.querySelector(".block");
  const s = block.value;
  if (s) {
    socket.emit("chat", {
      message: s,
      roomId: ROOM_ID,
      user: username,
    });
    const msgList = document.getElementById("msg-list");
    const html = `<li class="chat-message user-message"><h2 class="chat-sender font-bold">${username}</h2>${s}</li>`;
    msgList.insertAdjacentHTML("beforeend", html);
    block.value = "";
    block.style.height = "auto";
    chats.scrollTop = chats.scrollHeight;
  }
};
document.querySelector(".fa-paper-plane").addEventListener("click", displayMsg);
document.querySelector(".block").addEventListener("keypress", (event) => {
  if (event.code === "Enter") {
    event.preventDefault();
    displayMsg();
  }
});

socket.on("chat", function (data) {
  const msgList = document.getElementById("msg-list");
  const html = `<li class="chat-message"><h2 class="chat-sender font-bold">${data.user}</h2>${data.message}</li>`;
  msgList.insertAdjacentHTML("beforeend", html);
  document.querySelector(".block").value = "";
  chats.scrollTop = chats.scrollHeight;
});

const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

peer.on("open", (id) => {
  myId = id;
  socket.emit("join-room", ROOM_ID, id, username);
});

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
};
const videoToggle = document.getElementById("videoToggle");
const audioToggle = document.getElementById("audioToggle");

const connectToNewUser = (userId, stream) => {
  socket.emit("getCanvas", ROOM_ID);
  const conn = peer.connect(userId);
  const call = peer.call(userId, stream);
  // console.log(call);
  senders.push(call.peerConnection?.getSenders());
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });
  peers[userId] = call;
};

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream);
    peer.on("call", (call) => {
      peers[call.peer] = call;
      call.answer(stream);
      senders.push(call.peerConnection?.getSenders());
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
      call.on("close", () => {
        video.remove();
      });
    });
    socket.on("user-connected", async (userId) => {
      setTimeout(connectToNewUser, 1000, userId, stream);
    });
    socket.on("user-disconnected", (userId, users) => {
      createParticipants(users);
      if (peers[userId]) peers[userId].close();
    });
    videoToggle.addEventListener("click", toggleVideo);
    audioToggle.addEventListener("click", toggleAudio);
    myVideo.srcObject.getAudioTracks()[0].enabled = false;

    screenShare.addEventListener("click", async () => {
      let displayMediaStream = await navigator.mediaDevices.getDisplayMedia();
      for (let i = 0; i < senders.length; ++i)
        senders[i]
          .find((sender) => sender.track.kind === "video")
          .replaceTrack(displayMediaStream.getTracks()[0]);
      myVideo.srcObject = displayMediaStream;
      document.getElementById("screenSpan").classList.remove("btn-icon");
      document.getElementById("screenSpan").classList.add("screen-btn");
      screenShare.disabled = true;
      displayMediaStream.getVideoTracks()[0].addEventListener("ended", () => {
        document.getElementById("screenSpan").classList.remove("screen-btn");
        document.getElementById("screenSpan").classList.add("btn-icon");
        screenShare.disabled = false;
        for (let i = 0; i < senders.length; ++i)
          senders[i]
            .find((sender) => sender.track.kind === "video")
            .replaceTrack(
              stream.getTracks().find((track) => track.kind === "video")
            );
        myVideo.srcObject = stream;
      });
    });

    document
      .getElementById("recordToggle")
      .addEventListener("click", async function () {
        if (!currentlyRecording) {
          document.getElementById("videoRecordSpan").classList.add("active");
          recordStream = await recordScreen();
          let mimeType = "video/webm";
          mediaRecorder = createRecorder(recordStream, mimeType);
          currentlyRecording = true;
          addTimer();
          recordStream.getVideoTracks()[0].addEventListener("ended", () => {
            document
              .getElementById("videoRecordSpan")
              .classList.remove("active");
            mediaRecorder.stop();
            currentlyRecording = false;
            timer.remove();
            clearInterval(int);
          });
        } else {
          document.getElementById("videoRecordSpan").classList.remove("active");
          mediaRecorder.stop();
          currentlyRecording = false;
          recordStream.getTracks().forEach(function (track) {
            track.stop();
          });
          timer.remove();
          clearInterval(int);
        }
      });
  });

const toggleVideo = function () {
  let videoOn = 0;
  if (myVideo.srcObject.getVideoTracks()[0].enabled) {
    myVideo.srcObject.getVideoTracks()[0].enabled = false;
    videoToggle.innerHTML = '<i class="fa-solid fa-video-slash"></i>';
    document.getElementById("videoSpan").classList.remove("btn-icon");
    document.getElementById("videoSpan").classList.add("btn-icon-disable");
  } else {
    myVideo.srcObject.getVideoTracks()[0].enabled = true;
    videoToggle.innerHTML = '<i class="fa-solid fa-video"></i>';
    document.getElementById("videoSpan").classList.remove("btn-icon-disable");
    document.getElementById("videoSpan").classList.add("btn-icon");
    videoOn = 1;
  }
  if (isAdmin === "false") {
    socket.emit("videoAdmin", {
      roomId: ROOM_ID,
      id: myId,
      videoOn: videoOn,
    });
  }
};
socket.on("videoAdmin", (data) => {
  if (isAdmin === "true" && data.id !== myId) {
    let current_button = document.getElementById(`${data.id}$s`);
    if (data.videoOn) {
      current_button.classList.add("btn-icon-admin");
      current_button.classList.remove("btn-icon-admin-disable");
      document.getElementById(`${data.id}$`).innerHTML =
        '<i class="fa-solid fa-video ml-auto"></i>';
    } else {
      current_button.classList.add("btn-icon-admin-disable");
      current_button.classList.remove("btn-icon-admin");
      document.getElementById(`${data.id}$`).innerHTML =
        '<i class="fa-solid fa-video-slash ml-auto"></i>';
    }
  }
});
const toggleAudio = function () {
  let audioOn = 0;
  if (myVideo.srcObject.getAudioTracks()[0].enabled) {
    myVideo.srcObject.getAudioTracks()[0].enabled = false;
    audioToggle.innerHTML = '<i class="fa-solid fa-microphone-slash"></i>';
    document.getElementById("audioSpan").classList.remove("btn-icon");
    document.getElementById("audioSpan").classList.add("btn-icon-disable");
  } else {
    myVideo.srcObject.getAudioTracks()[0].enabled = true;
    audioToggle.innerHTML = '<i class="fa-solid fa-microphone"></i>';
    document.getElementById("audioSpan").classList.remove("btn-icon-disable");
    document.getElementById("audioSpan").classList.add("btn-icon");
    audioOn = 1;
  }
  if (isAdmin === "false") {
    socket.emit("audioAdmin", {
      roomId: ROOM_ID,
      id: myId,
      audioOn: audioOn,
    });
  }
};
socket.on("audioAdmin", (data) => {
  if (isAdmin === "true" && data.id !== myId) {
    let current_button = document.getElementById(`${data.id}#s`);
    if (data.audioOn) {
      current_button.classList.add("btn-icon-admin");
      current_button.classList.remove("btn-icon-admin-disable");
      document.getElementById(`${data.id}#`).innerHTML =
        '<i class="fa-solid fa-microphone ml-auto"></i>';
    } else {
      current_button.classList.add("btn-icon-admin-disable");
      current_button.classList.remove("btn-icon-admin");
      document.getElementById(`${data.id}#`).innerHTML =
        '<i class="fa-solid fa-microphone-slash ml-auto"></i>';
    }
  }
});
async function recordScreen() {
  return await navigator.mediaDevices.getDisplayMedia({
    audio: true,
    video: { mediaSource: "screen" },
  });
}
function createRecorder(stream, mimeType) {
  let recordedChunks = [];

  const mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = function (e) {
    if (e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };
  mediaRecorder.onstop = function () {
    saveFile(recordedChunks);
    recordedChunks = [];
  };
  mediaRecorder.start(200);
  return mediaRecorder;
}
function saveFile(recordedChunks) {
  const blob = new Blob(recordedChunks, {
    type: "video/webm",
  });
  let filename = window.prompt("Enter file name"),
    downloadLink = document.createElement("a");
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = `${filename}.webm`;

  document.body.appendChild(downloadLink);
  downloadLink.click();
  URL.revokeObjectURL(blob);
  document.body.removeChild(downloadLink);
}
const addTimer = function () {
  document.querySelector(".meeting_details").appendChild(timer);
  timer.innerHTML +=
    '<i style="font-size:.5rem; color:red;" class="fa-solid fa-circle"></i>';
  timer.style.alignItems = "center";
  const recordingData = document.createElement("span");
  recordingData.style.marginLeft = ".5rem";
  recordingData.innerText = "Recording - 00 : 00 : 00";

  timer.appendChild(recordingData);

  timer.style.marginLeft = "1rem";
  if (int != null) clearInterval(int);
  [seconds, minutes, hours] = [0, 0, 0];

  function displayTimer() {
    seconds++;
    if (seconds == 60) {
      seconds = 0;
      minutes++;
      if (minutes == 60) {
        minutes = 0;
        hours++;
      }
    }
    let h = hours < 10 ? "0" + hours : hours;
    let m = minutes < 10 ? "0" + minutes : minutes;
    let s = seconds < 10 ? "0" + seconds : seconds;

    recordingData.innerText = `Recording-${h} : ${m} : ${s}`;
  }

  int = setInterval(displayTimer, 1000);
};
const boardSpan = document.getElementById("boardSpan");
document.getElementById("boardToggle").addEventListener("click", () => {
  if (showingBoard) {
    whiteBoard.style.display = "none";
    videoGrid.style.display = "";
    boardSpan.classList.add("btn-icon");
    boardSpan.classList.remove("btn-icon-disable");
  } else {
    whiteBoard.style.display = "";
    videoGrid.style.display = "none";
    boardSpan.classList.add("btn-icon-disable");
    boardSpan.classList.remove("btn-icon");
  }
  showingBoard = !showingBoard;
});
canvas.style.width = "85%";
canvas.style.height = "100%";

canvas.clientWidth = canvas.style.width;
canvas.clientHeight = canvas.style.height;
let ctx = canvas.getContext("2d");
let x;
let y;
let isDrawing = false;
const a = canvas.width;
const b = canvas.height;
let drawSize = 3;
let color = "black";
let colorOther;
let drawSizeOther;
socket.on("getCanvas", (url) => {
  let img = new Image();
  img.onload = start;
  img.src = url;
  function start() {
    ctx.drawImage(img, 0, 0);
  }
});
function draw(newX, newY, oldX, oldY) {
  ctx.strokeStyle = color;
  ctx.lineWidth = drawSize;
  ctx.beginPath();
  ctx.moveTo(oldX, oldY);
  ctx.lineTo(newX, newY);
  ctx.stroke();
  ctx.closePath();
  socket.emit("storeCanvas", canvas.toDataURL(), ROOM_ID);
}
function drawOther(newX, newY, oldX, oldY) {
  ctx.strokeStyle = colorOther;
  ctx.lineWidth = drawSizeOther;
  ctx.beginPath();
  ctx.moveTo(oldX, oldY);
  ctx.lineTo(newX, newY);
  ctx.stroke();
  ctx.closePath();
}
canvas.addEventListener("mousedown", (e) => {
  x = ((e.offsetX * canvas.width) / canvas.clientWidth) | 0;
  y = ((e.offsetY * canvas.height) / canvas.clientHeight) | 0;
  isDrawing = 1;
});
canvas.addEventListener("mousemove", (e) => {
  if (isDrawing) {
    newX = ((e.offsetX * canvas.width) / canvas.clientWidth) | 0;
    newY = ((e.offsetY * canvas.height) / canvas.clientHeight) | 0;
    draw(newX, newY, x, y);
    socket.emit("draw", newX, newY, x, y, color, drawSize, ROOM_ID);
    x = newX;
    y = newY;
  }
});
socket.on("draw", (newX, newY, x, y, color, drawSize) => {
  colorOther = color;
  drawSizeOther = drawSize;
  drawOther(newX, newY, x, y);
});
window.addEventListener("mouseup", (e) => {
  if (isDrawing) {
    isDrawing = 0;
  }
});
function clearBoard() {
  if (window.confirm("Are you sure you want to clear board?")) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("storeCanvas", canvas.toDataURL, ROOM_ID);
    socket.emit("clearBoard", ROOM_ID);
  } else return;
}
socket.on("clearBoard", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});
function setEraser() {
  color = "white";
  drawSize = 10;
}
function setColor(newColor) {
  color = newColor;
  drawSize = 3;
}
