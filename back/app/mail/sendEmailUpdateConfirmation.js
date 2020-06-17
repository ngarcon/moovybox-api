const sendMail = require('./postService');
const appConfig = require ('../config'); 

/** EMAIL UPDATE CONFIRMATION */
// This comes at the second step  of email change process
// At this stage the current email user has accepted change for the new email adress. 

// The purpose of this email is to ensure that the next email recipient accets the changes as well
// 


module.exports = async (emailData) => {

  //? emailData : {pseudo, new_email, email, token }
  const link = `${appConfig.domain}/profile/confirm-new-email-update/${emailData.token}`; 

  // Addition of a custom subject for the email
  emailData.subject = `Profil Moovybox - Validation de modification de ton adresse mail`; 

  // Addition of a customed email for email update
  emailData.html = `
    <body>
    <section>
      <header>
        <h1>Je change d'email</h1>
      </header>

      <p>Bonjour,</p>

      <p>Si tu tentes de changer d'adresse email, clique sur le bouton suivant pour valider le changement. Sinon, fais comme t'avais rien vu ;) . </p> 

      <a href="${link}">J'ai compris et je confirme mon changement d'email</a>

      <p>Si le bouton ne marche pas, clique sur le lien suivant: <a href="${link}">${link}</a></p> 

      <p>Attention ces liens ne sont valables que 24h.</p> 

      <footer>
      
      </footer>

    </section> 
    
  </body>`;
    
    return await sendMail(emailData); 
}