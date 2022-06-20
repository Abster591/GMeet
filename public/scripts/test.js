const chatSection = document.getElementById("chat-section");
const userSection = document.getElementById("participant-section");
const informationSection = document.getElementById("information-section");

const chatButton = document.getElementById("btn-chats");
const userButton = document.getElementById("btn-users");
const informationButton = document.getElementById("btn-information");

let chatEnabled = false;
let userEnabled = false;
let informationEnabled = false;

const enableVideoGrid = () => {
  videoGrid.style.width = "100%";
};

const disableVideoGrid = () => {
  videoGrid.style.width = "75%";
};

const enableChatSection = () => {
  chatSection.style.width = "24%";
  chatButton.classList.add("active");
};

const disableChatSection = () => {
  chatSection.style.width = "0";
  chatButton.classList.remove("active");
};

const enableUserSection = () => {
  userSection.style.width = "24%";
  userButton.classList.add("active");
};

const disableUserSection = () => {
  userSection.style.width = "0";
  userButton.classList.remove("active");
};

const enableInformationSection = () => {
  informationSection.style.width = "24%";
  informationButton.classList.add("active");
};

const disableInformationSection = () => {
  informationSection.style.width = "0";
  informationButton.classList.remove("active");
};

chatButton.addEventListener("click", () => {
  if (informationEnabled) {
    disableInformationSection();
    informationEnabled = false;
    enableChatSection();
  } else if (userEnabled) {
    disableUserSection();
    userEnabled = false;
    enableChatSection();
  } else if (chatEnabled) {
    disableChatSection();
    enableVideoGrid();
  } else {
    enableChatSection();
    disableVideoGrid();
  }
  chatEnabled = !chatEnabled;
});

userButton.addEventListener("click", () => {
  if (informationEnabled) {
    disableInformationSection();
    informationEnabled = false;
    enableUserSection();
  } else if (chatEnabled) {
    disableChatSection();
    chatEnabled = false;
    enableUserSection();
  } else if (userEnabled) {
    disableUserSection();
    enableVideoGrid();
  } else {
    enableUserSection();
    disableVideoGrid();
  }
  userEnabled = !userEnabled;
});

informationButton.addEventListener("click", () => {
  if (informationEnabled) {
    disableInformationSection();
    enableVideoGrid();
  } else if (chatEnabled) {
    disableChatSection();
    chatEnabled = false;
    enableInformationSection();
  } else if (userEnabled) {
    disableUserSection();
    userEnabled = false;
    enableInformationSection();
  } else {
    disableVideoGrid();
    enableInformationSection();
  }
  informationEnabled = !informationEnabled;
});

document.getElementById("copy-btn").addEventListener("click", () => {
  const text = document.getElementById("meeting-link").textContent;
  navigator.clipboard.writeText(text);

  const tooltip = document.getElementById("tooltip-text");
  tooltip.style.display = "inline-block";

  setTimeout(() => {
    tooltip.style.display = "none";
  }, 1000);
});
