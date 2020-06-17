const sendMail = require('./postService');
const appConfig = require ('../config'); 


/** EMAIL UPDATE CONFIRMATION */
// This comes at the first checking stage of email change process

module.exports = async (emailData) => {

  //? emailData : {pseudo, email, new_email}

  // Addition of a custom subject for the email
  emailData.subject = `Profil Moovybox - Email de compte modifié`; 

  // Addition of a customed email for email update
  emailData.html = `
    <body>
    <section>
      <header>
        <h1>Confirmation de changement d'email</h1>
      </header>
    
      <p>Bonjour ${emailData.pseudo},</p>

      <p>Ton compte Moovybox est désormais accessible avec l'adresse suivante : <span>${emailData.new_email}</span></p> 

      <p>Tu gardes le même mot de passe.</p>

      <p>Amuses-toi bien avec tes cartons ;) </p>

      <p>On te souhaites une joyeuse nouvelle page de vie :) </p> 

      <p>L'équipe Moovybox</p> 

      <footer>
        
      </footer>

    </section> 
    
  </body>`;
    
    return await sendMail(emailData); 
}