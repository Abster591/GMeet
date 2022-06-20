const socket = io("/");
console.log(ROOM_ID, username);
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
    li.innerHTML = `<i class="fa-solid fa-user"></i><span class="text-base ml-5">${user.name} </span><button class="ml-auto rounded-full px-5 py-2 hover:bg-slate-100 transition-all" style="border-radius:50%;"><i class="fa-solid fa-ellipsis-vertical ml-auto"></i></button>`;
    li.setAttribute("id", user.id);
    participantList.appendChild(li);
  });
};

socket.on("participant-list-updated", (users) => {
  createParticipants(users);
});

const removeParticipant = (id) => {
  const participant = document.querySelector(`[id="${id}"]`);
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
            document.getElementById("videoRecordSpan").classList.remove("active");
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
  }
};
const toggleAudio = function () {
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
  }
};
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
