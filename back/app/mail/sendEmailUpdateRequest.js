const sendMail = require('./postService');
const appConfig = require ('../config'); 


/** EMAIL UPDATE CONFIRMATION */
// This comes at the first checking stage of email change process

module.exports = async (emailData) => {

  //? emailData : {pseudo, new_email, email, token }

  const link = `${appConfig.domain}/profile/confirm-email-update/${emailData.token}`; 

  // Addition of a custom subject for the email
  emailData.subject = `Profil Moovybox - Il faut confirmer la modification de ton adresse mail`; 

  // Addition of a customed email for email update
  emailData.html = `
    <body>
    <section>
      <header>
        <h1>Confirmation de changement d'email</h1>
      </header>
    
      <p>Bonjour ${emailData.pseudo},</p>

      <p>On dirait que tu veux modifier ton adresse mail pour utiliser cette nouvelle adresse : <span>${emailData.new_email}</span></p> 

      <p>ATTENTION : En validant ce changement, tu ne pourras plus te connecter avec l'adresse  <span>${emailData.email}</span> rattaché à ton compte</p>

      <p>Si acceptes, tu conserveras le même mot de passe. Il faudra valider la nouvelle adresse mail (on t'envois un mail à la nouvelle adresse) et tu devras te reconnecter avec cette nouvelle adresse. </p>
      
      <a href="${link}">J'ai compris et je confirme mon changement d'email et je me reconnecte</a>

      <p> Si le bouton ne marche pas, clique sur le lien suivant: <a href="${link}">${link}</a></p> 

      <p>Attention ces liens ne sont valables que 24h.</p> 

      <p>L'équipe Moovybox</p> 

      <footer>
        <a href="">J'arrete tout! Les cartons c'est pas mon truc, moi j'aime bien les origamis</a>
      </footer>

    </section> 
    
  </body>`;
    
    return await sendMail(emailData); 
}