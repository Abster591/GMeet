const socket = io("/");
console.log(ROOM_ID, username);
const chats = document.querySelector('.chats');
const senders = [];
const screenShare = document.getElementById('screenShare');
const peer = new Peer(undefined, {
  host: "/",
  port: "3001",
});
const displayMsg = () => {
  const s = document.querySelector(".block").value;
  if (s) {
    socket.emit("chat", {
      message: s,
      roomId: ROOM_ID,
      user: username,
    });
    const msgList = document.getElementById("msg-list");
    const html = `<li class="chat-message user-message"><h2 class="chat-sender font-bold">${username}</h2>${s}</li>`;
    msgList.insertAdjacentHTML("beforeend", html);
    document.querySelector(".block").value = "";
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
  console.log(data, "ou");
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
  socket.emit("join-room", ROOM_ID, id);
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
  const call = peer.call(userId, stream);
  senders.push(call.peerConnection?.getSenders());
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
};
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {

    addVideoStream(myVideo, stream);
    peer.on("call", (call) => {
        call.answer(stream);
        senders.push(call.peerConnection?.getSenders());
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", async (userId) => {
      setTimeout(connectToNewUser, 1000, userId, stream);
    });

    videoToggle.addEventListener("click", toggleVideo);
    audioToggle.addEventListener("click", toggleAudio);
    myVideo.srcObject.getAudioTracks()[0].enabled = false;
    screenShare.addEventListener('click', async () => {
        let displayMediaStream = await navigator.mediaDevices.getDisplayMedia();
        for(let i=0;i<senders.length;++i)
            senders[i].find(sender => sender.track.kind === 'video').replaceTrack(displayMediaStream.getTracks()[0]);
        myVideo.srcObject = displayMediaStream;
        document.getElementById('screenSpan').classList.remove('btn-icon');
        document.getElementById('screenSpan').classList.add('screen-btn');
        screenShare.disabled = true;
        displayMediaStream.getVideoTracks()[0].addEventListener('ended',()=>{  
        document.getElementById('screenSpan').classList.remove('screen-btn');
        document.getElementById('screenSpan').classList.add('btn-icon');
        screenShare.disabled = false;
        for(let i=0;i<senders.length;++i)
            senders[i].find(sender => sender.track.kind === 'video').replaceTrack(stream.getTracks().find(track => track.kind === 'video'));
        myVideo.srcObject = stream;
        })
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
// socket.on("user-connected", () => {
//   connectToNewUser();
// });
// const shareScreen = ()=>{
//     if(isSharing===false)
//     {
//     navigator.mediaDevices.getDisplayMedia({video:true,audio:false}).then((stream)=>{
//         myVideo.srcObject = stream;
//         isSharing = true;
//         stream.getVideoTracks()[0].addEventListener('ended',()=>{
//         navigator.mediaDevices.getUserMedia({video:true,audio:true}).then((stream)=>{
//             myVideo.srcObject=stream;
//             isSharing = false;        
//             })
//         })
//     })
//     }
//     else
//     {
//             navigator.mediaDevices.getUserMedia({video:true,audio:true}).then((stream)=>{
//             myVideo.srcObject=stream;
//             isSharing = false;        
//             })
//     }
// }
