const sendMail = require('./postService');
const appConfig = require ('../config'); 


/** PASSWORD RESET REQUEST */
// This request is accessible to anyone with a registered email

module.exports = async (emailData) => {

  //? emailData : {pseudo, email, token}

  const link = `${appConfig.domain}/profile/reset-password/${emailData.token}`; 

  // Addition of a custom subject for the email
  emailData.subject = `Profil Moovybox - Réinitialisation de ton mot de passe`; 

  // Addition of a customed email for email update
  emailData.html = `
    <body>
    <section>
      <header>
        <h1>Réinitialisation de ton mot de passe</h1>
      </header>
    
      <p>Bonjour ${emailData.pseudo},</p>

      <p>On a reçu une demande de réinitialisation de mot de passe pour ton compte Moovybox. Si ce n'est pas toi qui l'a démandé, tu peux ignorer ce mail.</p> 

      <p>Sinon clique sur le bouton suivant pour choisir un nouveau mot de passe :</p>

      <a href="${link}">Réinitialiser mon mot de passe</a>

      <p>On te souhaites une joyeux nouvelle page de vie :) </p> 

      <p>L'équipe Moovybox</p> 

      <footer>
        
      </footer>

    </section> 
    
  </body>`;
    
    return await sendMail(emailData); 
}