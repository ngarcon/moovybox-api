const nodemailer = require('nodemailer');

require('dotenv').config(); 

const password = process.env.SMTPPASSWORD; 
const mailUser = process.env.SMTPUSER;


let transportGmail  = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
       user: mailUser,
       pass: password
    }, 
    tls: 443
});


const sendMail = async (emailData) => {

  // ? emailData {subject, email, html}
  // - Use the email function sendMail({userEmail, userToken, subject, html})
  try {
    const message = {
      from: process.env.SMTPUSER, // Sender address
      to: emailData.email,  // List of recipients
      subject: emailData.subject, // Subject line
      html: emailData.html// html body define by de postService caller
    };

    const result = await transportGmail.sendMail(message);

    return result; 

  } catch (error) {
    console.trace(error); 
  }
}

module.exports = sendMail;
