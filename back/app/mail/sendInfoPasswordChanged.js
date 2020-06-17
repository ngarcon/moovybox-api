const sendMail = require('./postService');
const appConfig = require ('../config'); 


/** EMAIL UPDATE CONFIRMATION */
// This comes at the first checking stage of email change process

module.exports = async (emailData) => {

  //? emailData : {pseudo, email}

  // Addition of a custom subject for the email
  emailData.subject = `Profil Moovybox - Mot de passe modifié`; 

  // Addition of a customed email for email update
  emailData.html = `
    <body>
    <section>
      <header>
        <h1>Confirmation de modification de mot de passe</h1>
      </header>
    
      <p>Bonjour ${emailData.pseudo},</p>

      <p>Nous t'informons que ton mot de passe vient d'être modifié.</p> 

      <p>Amuses-toi bien avec tes cartons ;) </p>

      <p>On te souhaites une joyeuse nouvelle page de vie :) </p> 

      <p>L'équipe Moovybox</p> 

      <footer>
        
      </footer>

    </section> 
    
  </body>`;
    
    return await sendMail(emailData); 
}