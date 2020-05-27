const nodemailer = require('nodemailer');
const ejs = require('ejs'); 
const path = require('path'); 
const Email = require('email-templates'); 
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

const message = {
  from: process.env.SMTPUSER, // Sender address
  to: process.env.SMTPUSER,
  subject: 'Un sujet de mail'       // List of recipients // Subject line
};

const email  = new Email({
  message : message, 
  transport: transportGmail, 
  views: {
    root: path.resolve('views'),
    options: {
      extension: 'ejs' // <---- HERE
    }
  },
  preview: {
    open: {
      app: 'firefox',
      wait: false
    }
  },
  send: true
}); 




(async ()=> {

  try {
    const results = await email.send({
      message : message, 
      template: 'email',
      locals: {subject : "Ceci est le sujet du mail"},
      
    }); 

    console.log('results', results); 
    
  } catch (error) {
    console.trace(error); 
  }
})(); 


/*

  const template = await createTemplate('email', {subject: 'ceci est le sujet du mail'}); 
  
  const message = {
    from: process.env.SMTPUSER, // Sender address
    to: process.env.SMTPUSER,         // List of recipients
    subject: 'Bienvenue sur Moovybox', // Subject line
    html: await createTemplate('email', {subject: 'ceci est le sujet du mail'}), // Plain text body
  };
  

  console.log('template', template); 
  const result = await transportGmail.sendMail(message);

// module.exports = */
