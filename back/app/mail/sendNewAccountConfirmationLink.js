const sendMail = require('./postService');
const appConfig = require ('../config'); 


/** PASSWORD RESET REQUEST */
// This request is accessible to anyone with a registered email

module.exports = async (emailData) => {

  //? emailData : {pseudo, email, token}

  const link = `${appConfig.domain}/confirmation/${emailData.token}`; 

  // Addition of a custom subject for the email
  emailData.subject = `Profil Moovybox - Nouveau lien de confirmation de compte`; 

  // Addition of a customed email for email update
  emailData.html = `
    <body>
    <section>
      <header>
        <h1>Nouveau lien de confirmation de compte</h1>
      </header>
    
      <p>Bonjour ${emailData.pseudo},</p>

      <p>On a reçu une nouvelle demande de lien d'activation pour ton compte Moovybox. Si ce n'est pas toi qui l'a démandé, tu peux ignorer ce mail.</p> 

      <p>Voici ton lien d'activation:</p>

      <a href="${link}">Réinitialiser mon mot de passe</a>

      <p>Amuse toi bien :) </p> 

      <p>L'équipe Moovybox</p> 

      <footer>
        
      </footer>

    </section> 
    
  </body>`;
    
    return await sendMail(emailData); 
}