const participantEmailInput = document.getElementById("participant-email");
const participantList = document.getElementById("participant-list");

const sumbmitButton = document.getElementById("submit-details");

const meetingTitle = document.getElementById("meeting-title");
const organiserName = document.getElementById("organiser-name");
const organiserEmail = document.getElementById("organiser-email");
const meetingDateTime = document.getElementById("meeting-date-time");
const meetingDescription = document.getElementById("meeting-description");

const organiserEmailError = document.getElementById("organiser-email-error");
const organiserNameError = document.getElementById("organiser-name-error");
const dateTimeError = document.getElementById("date-time-error");

organiserEmail.addEventListener("focus", () => {
  organiserEmailError.style.display = "none";
  organiserEmail.classList.remove("incorrect");
});

window.addEventListener("load", () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  date.setMilliseconds(null);
  date.setSeconds(null);
  meetingDateTime.value = date.toISOString().slice(0, -1);
});

organiserName.addEventListener("focus", () => {
  organiserNameError.style.display = "none";
  organiserName.classList.remove("incorrect");
});

meetingDateTime.addEventListener("focus", () => {
  dateTimeError.style.display = "none";
  meetingDateTime.classList.remove("incorrect");
});

const postData = async (url, data) => {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    location.href = response.url;
  } catch (e) {
    console.error(e.message);
  }
};

const addParticipant = (email) => {
  const li = document.createElement("li");
  li.innerHTML = `<li class="flex items-center mb-1"><i class="fa-solid fa-user"></i><span class="text-base ml-5">${email}</span><button onclick="removeParticipant(this)"class="ml-5 rounded-full hover:bg-slate-100 px-2 transition-all" style="border-radius:50%;"><i class="fa-solid fa-xmark"></i></button>`;
  participantList.append(li);
};

const removeParticipant = (element) => {
  const participant = element.parentNode;
  participant.remove();
};

const validateEmail = (email) => {
  const pattern = new RegExp(
    "([!#-'*+/-9=?A-Z^-~-]+(.[!#-'*+/-9=?A-Z^-~-]+)*|\"([]!#-[^-~ \t]|(\\[\t -~]))+\")@([!#-'*+/-9=?A-Z^-~-]+(.[!#-'*+/-9=?A-Z^-~-]+)*|[[\t -Z^-~]*])"
  );
  return pattern.test(email);
};

const checkDuplicate = (email) => {
  for (const li of participantList.children)
    if (li.innerText === email) return true;
  return false;
};

const participantEmailError = document.getElementById(
  "participant-email-error"
);
participantEmailInput.addEventListener("keydown", (e) => {
  if (e.code === "Enter") {
    const email = e.target.value;
    if (!validateEmail(email)) {
      participantEmailError.innerText = "Please enter a valid email";
      participantEmailError.style.display = "block";
      participantEmailInput.classList.add("incorrect");
    } else if (checkDuplicate(email)) {
      participantEmailError.innerText = "Participant already invited";
      participantEmailError.style.display = "block";
      participantEmailInput.classList.add("incorrect");
    } else {
      addParticipant(email);
      participantEmailInput.value = "";
    }
  } else {
    participantEmailError.style.display = "none";
    participantEmailInput.classList.remove("incorrect");
  }
});

const formValidate = (data) => {
  let err = false;
  if (!validateEmail(data.organiserEmail)) {
    err = true;
    organiserEmailError.style.display = "block";
    organiserEmail.classList.add("incorrect");
  }
  if (data.organiserName === "") {
    err = true;
    organiserNameError.style.display = "block";
    organiserName.classList.add("incorrect");
  }

  if (!data.meetingDateTime) {
    err = true;
    dateTimeError.style.display = "block";
    meetingDateTime.classList.add("incorrect");
  }

  return err;
};

sumbmitButton.addEventListener("click", () => {
  const participantEmails = [];
  for (const li of participantList.children) {
    participantEmails.push(li.innerText);
  }
  const data = {
    organiserName: organiserName.value,
    organiserEmail: organiserEmail.value,
    meetingTitle: meetingTitle.value ? meetingTitle.value : "Meeting",
    meetingDateTime: meetingDateTime.value,
    meetingDescription: meetingDescription.value,
    participantEmails: participantEmails,
  };
  if (!formValidate(data)) postData("http://localhost:3000/schedule", data);
});
