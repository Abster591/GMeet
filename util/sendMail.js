const nodemailer = require("nodemailer");

const createTemplate = (
  organiserName,
  organiserEmail,
  meetingDateTime,
  meetingDescription,
  meetingId,
  meetingLink
) => {
  return `<!DOCTYPE html>
    <html lang="en" style="font-family: sans-serif;line-height: 2;font-size: 1.1rem;">
    
    <head style="font-family: sans-serif;line-height: 2;font-size: 1.1rem;">
        <meta charset="UTF-8" style="font-family: sans-serif;line-height: 2;font-size: 1.1rem;">
        <meta http-equiv="X-UA-Compatible" style="font-family: sans-serif;line-height: 2;font-size: 1.1rem;">
        <title style="font-family: sans-serif;line-height: 2;font-size: 1.1rem;">Email</title>
    </head>
    
    
    <body style="font-family: sans-serif;line-height: 2;font-size: 1.1rem;">
        <div class="container" style="font-family: sans-serif;line-height: 2;font-size: 1.1rem;width: 60%;margin: 0 auto;padding: 1rem;">
            Hello, <br style="font-family: sans-serif;line-height: 2;font-size: 1.1rem;">
            You have a meeting scheduled for <span class="header" style="font-family: sans-serif;line-height: 2;font-size: 1.1rem;font-weight: 600;">${meetingDateTime}</span> <br style="font-family: sans-serif;line-height: 2;font-size: 1.1rem;">
            Here are the details for the meeting:
            <ul style="font-family: sans-serif;line-height: 2;font-size: 1.1rem;list-style: none;">
                <li style="font-family: sans-serif;line-height: 2;font-size: 1.1rem;"><span class="header" style="font-family: sans-serif;line-height: 2;font-size: 1.1rem;font-weight: 600;">Meeting Host</span>: ${organiserName}</li>
                <li style="font-family: sans-serif;line-height: 2;font-size: 1.1rem;"><span class="header" style="font-family: sans-serif;line-height: 2;font-size: 1.1rem;font-weight: 600;">Host email</span>: ${organiserEmail}</li>
                <li style="font-family: sans-serif;line-height: 2;font-size: 1.1rem;"><span class="header" style="font-family: sans-serif;line-height: 2;font-size: 1.1rem;font-weight: 600;">Meeting Id</span>: <span class="meeting-id" style="font-family: sans-serif;line-height: 2;font-size: 1.1rem;">${meetingId}</span></li>
            </ul>
            <div class="btn-container" style="font-family: sans-serif;line-height: 2;font-size: 1.1rem;text-align: right;">
                <a href="${meetingLink}" style="font-family: sans-serif;line-height: 2;font-size: 1.1rem;text-decoration: none;padding: .75rem 1rem;color: white;border-radius: .25em;font-weight: 600;background-color: black;transition: .6s;">Join Meeting</a>
            </div>
    
            <div class="header" style="margin-top: 1rem;font-family: sans-serif;line-height: 2;font-size: 1.1rem;font-weight: 600;">Meeting Description</div>
            <p style="font-family: sans-serif;line-height: normal;font-size: 1.1rem;">
              ${meetingDescription}
            </p>
    
        </div>
    
    </body>
    
    </html>`;
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.APP_PASSWORD,
  },
});

const sendEmailtoParticipants = (
  organiserName,
  organiserEmail,
  meetingTitle,
  meetingDateTime,
  meetingDescription,
  participantEmails,
  meetingId
) => {
  const meetingLink = `http://localhost:3000/${meetingId}`;
  const mailOptions = {
    from: "manusinghapril@gmail.com",
    to: participantEmails,
    subject: `${meetingTitle}`,
    html: createTemplate(
      organiserName,
      organiserEmail,
      meetingDateTime,
      meetingDescription,
      meetingId,
      meetingLink
    ),
  };
  transporter.sendMail(mailOptions, (err, info) => {
    if (err) console.log(err);
    else console.log(info);
  });
};

module.exports = sendEmailtoParticipants;
