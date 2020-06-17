const sendMail = require('./postService');
const appConfig = require ('../config'); 

/** ACCOUNT CONFIRMATION */

module.exports = async (emailData) => {

  //? emailData : {pseudo, email, token}
  const link = `${appConfig.domain}/confirmation/${emailData.token}`; 

  emailData.subject = `Bienvenue ${emailData.pseudo} - Activer votre compte Moovybox`; 

  emailData.html = `
  <body>
    <section>
      <header>
        <h1>J'active mon compte Moovybox</h1>
      </header>
    
      <p>Bonjour ${emailData.pseudo},</p>

      <p> L'équipe Moovybox est fière de te compter parmi ses utilisateurs, plus qu'une étape cliquer sur le bouton suivant</p> 
      
      <a href="${link}">Activer mon compte</a>

      <p> Sinon, clique sur le lien suivant: <a href="${link}">${link}</a></p> 

      <p> Attention ces liens ne sont valables que 24h.</p> 

      <footer>
        <a href="">J'arrete tout! Les cartons c'est pas mon truc, moi j'aime bien les origamis</a>
      </footer>

    </section> 
    
  </body>`;
  
  return await sendMail(emailData); 
}