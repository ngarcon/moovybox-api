const Joi = require('@hapi/joi');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const salt = parseInt(process.env.SALT, 10);
const jwt = require('jsonwebtoken');
const sendEmailUpdateRequest = require('../mail/sendEmailUpdateRequest'); 
const sendEmailUpdateConfirmation = require('../mail/sendEmailUpdateConfirmation'); 
const sendInfoEmailChanged = require('../mail/sendInfoEmailChanged'); 
const sendInfoPasswordChanged = require('../mail/sendInfoPasswordChanged'); 

const pseudoSchema = Joi.object({
    pseudo: Joi.string()
        .pattern(new RegExp('^[^<>:%]{0,}$'))
        .min(3)
        .max(30)
        .required()
}); 

const updateEmailSchema = Joi.object({
    old_email: Joi.string()
        .email()
        .required(),
    new_email: Joi.string()
        .email()
        .required(),
    password:  Joi.string()
        .pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$'))
        .required(),
}); 

const passwordChangeSchema = Joi.object({
    old_password: Joi.string()
        .pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$'))
        .required(),
    new_password: Joi.string()
        .pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$'))
        .required(),
    password_repeat: Joi.any().valid(Joi.ref('new_password')).required()
        
})


const profileController = {

    updatePseudo: async (req, res) => {
        //* Updating user pseudo 
        //?  payload {pseudo}

        try {

            // At this stage a user login state is tested
            const pseudoValidation = await pseudoSchema.validate(req.body);
            console.log('req.body', req.body);
            console.log('pseudoValidation', pseudoValidation);

            // If payload is not proper send error; 
            if (!!pseudoValidation.error) {
                return res.status(400).send(pseudoValidation.error); 
            }

            const userId = req.session.user.id; 

            const user = await User.findByPk(userId); 

            if (!user) {
                return res.status(404).send({
                    statusCode : 404,
                    message : { // server code 404 : not found
                        en: "User not found.", 
                        fr: "Pas d'utilisateur"
                    }
                }); 
            }

            // A user was found 
            user.pseudo = req.body.pseudo; 

            // pass req obj to model function for pseudo update
            const updatedUser = await user.save(); 
            // Send update value in session 
            req.session.user.pseudo = updatedUser.pseudo; 
            // remove password from object to send as response
            delete updatedUser.password; 
            // send it back to front
            res.send(updatedUser); 
        } catch (error) {
            console.trace(error); 
        }
    }, 

    requestEmailUpdate: async (req, res) => {
        //* Request an update of the email
        //* Send a first confirmation email the current email address 
        //? payload : {old_email, new_email, password}

        try {
            // At this stage a user login state is tested
            const updateEmailValidation = await updateEmailSchema.validate(req.body);
            console.log('req.body', req.body);
            console.log('updateEmailValidation', updateEmailValidation);

            // If payload is not proper send error; 
            if (!!updateEmailValidation.error) {
                console.log('updateEmailValidation.error', updateEmailValidation.error);
                return res.status(400).send(updateEmailValidation.error); 
            }

            const userID  = req.session.user.id; 

            // Retrieve/Get current user from DB 
            const storedUser = await User.findByPk(userID);

            // Check matching email with the once in session 
            const passwordMatch = await bcrypt.compare(req.body.password, storedUser.password);
            
            if (!passwordMatch) {
                //  If no match send error (wrong password)
                return res.status(401).send({
                    error : {
                        statusCode: 401,
                        message: {
                            en:"Wrong password", 
                            fr:"Mot de passe incorrect"
                        }
                    }
                }); 
            }

            // Check matching email with the once in session 
            if(req.body.old_email != storedUser.email) {
                return res.status(400).send({
                    error : {
                        statusCode: 400,
                        message: {
                            en:"Current email does not match.", 
                            fr:"L'email actuel ne correspond pas."
                        }
                    }
                }); 
            }; 

            // Check if email doesn't already exist
            const emailExists = await User.emailExists(req.body.new_email); 

            // If email exists, send error : 409 Conflict
            if (emailExists) {
                return  res.status(409).send({
                    error : {
                        statusCode: 409,
                        message: {
                            en:"This email is not available", 
                            fr:"Ce mail n'est pas disponible. "
                        }
                    }
                });
            }

            // At this stage passwords and current emails are matching
            // We can proceed to email sending to confirm new email
           
            // We prepram the
            
            const dataToToken = {
                id: storedUser.id,
                old_email: storedUser.email,  
                new_email: req.body.new_email
            }; 

            const emailInfo = {
                pseudo: storedUser.pseudo, 
                new_email: req.body.new_email, // new email to mention in this email 
                email: storedUser.email, // current recipent : current user email 
                // - Create token with user id, old_email, new_email
                token: jwt.sign(dataToToken, process.env.TOKENKEY, {expiresIn: '1d'}) 
            }; 

            
            // - Use the email function ({pseudo, email, new_email, token})
            await sendEmailUpdateRequest(emailInfo); 

            res.status(200).send({ // server code 200 : success
                en: "Success - The email update confirmation link has been sent to current email.", 
                fr: "Réussie - Le nouveau lien de confirmation a été envoyé."
            });

        } catch (error) {
            console.trace(error); 
        }
    }, 

    confirmEmailUpdate: async (req, res) => {
        //* Receive a change confirmation from the current user email
        //* Send a second confirmation email, this time to the new email address 
        //? token : {id, old_email, new_email}
        try {

            // verifiy token 
            const jwtPayload = jwt.verify(req.params.token, process.env.TOKENKEY); 

            console.log('jwtPayload', jwtPayload); 

            
            const storedUser = await User.findByEmail(jwtPayload.old_email);
                
            const dataToToken = {
                id: storedUser.id,
                old_email: storedUser.email,  
                new_email: jwtPayload.new_email,
            }; 

            // Set the email objet for second step confirmation
            // generate new token to add to emailInfo
            const emailInfo = {
                pseudo: storedUser.pseudo, 
                old_email: storedUser.email, // old email to mention : current user email
                email: jwtPayload.new_email, // current recipient : new email holder
                // - Create token with user id, old_email, new_email
                token: jwt.sign(dataToToken, process.env.TOKENKEY, {expiresIn: '1d'}) 
            }; 
            
            // Send email 
            await sendEmailUpdateConfirmation(emailInfo); 

            res.send(`
            <!DOCTYPE html>
            <html lang="fr">
            <head>
            </head>
            <body>
                <script>
                    alert("On t'envois un mail à la nouvelle adresse ;)"); 
                    window.close(); 
                </script>
            </body>
            </html>
            `); 
            
        } catch (error) {
            console.trace(error); 
        }
    }, 

    updateEmail: async (req,res) => {
        try {
            // verifiy token 
            const jwtPayload = jwt.verify(req.params.token, process.env.TOKENKEY); 

            console.log('jwtPayload', jwtPayload); 

            // find current user by email 
            const storedUser = await User.findByEmail(jwtPayload.old_email); 

            // update email in DB
            storedUser.email = jwtPayload.new_email; 
            console.log('storedUser', storedUser);

            if (!storedUser) {
                return res.status(404).send(`
                <!DOCTYPE html>
                <html lang="fr">
                <head>
                </head>
                <body>
                    <script>
                        alert('Utilisateur non trouvé');
                        window.close(); 
                    </script>
                </body>
                </html>
                `); 
            }

            const saveSuccess = await storedUser.save(jwtPayload); 
            // success with redirection to home page
            if (saveSuccess) {
                const emailInfo = {
                    pseudo: storedUser.pseudo, 
                    email: jwtPayload.old_email,
                    new_email: jwtPayload.new_email
                }

                await sendInfoEmailChanged(emailInfo); 

                res.send(`
                <!DOCTYPE html>
                <html lang="fr">
                <head>
                </head>
                <body>
                    <script>
                        alert("Tu peux maintenant te connecter avec ta nouvelle adresse."); 
                        window.close(); 
                    </script>
                </body>
                </html>
                `); 
            }
            
        } catch (error) {
            console.trace(error); 
        }
    }, 

    updatePassword : async (req, res) => {
        //* Updating Password under user request 
        //? Payload : {old_password, new_password, password_repeat}
        try {
            
            // validate payload data
            const payloadValidation = await passwordChangeSchema.validate(req.body); 
    
            // If payload is not valid (no error)
            if (!!payloadValidation.error) {
                // abort and send error 
                return res.status(400).send(payloadValidation.error); 
            }
    
            // If payload is valid
                // move on 

            const userID = req.session.user.id; 
            // get current user
            const storedUser = await User.findByPk(userID); 

            console.log("req.body.old_password", req.body.old_password); 
            console.log("storedUser.password", storedUser.password); 
    
            // match old_password with saved password in DB
            const passwordMatch = await bcrypt.compare(req.body.old_password, storedUser.password); 
            console.log("passwordMatch",passwordMatch); 
            // if no match 
            if (!passwordMatch) {
                // abort and send error 
                res.status(401).send({
                    error : {
                        statusCode: 401,
                        message: {
                            en:"Wrong password", 
                            fr:"Mot de passe incorrect"
                        }
                    }
                }); 
            }
            // If match 
            // change password in storedUser and update
            storedUser.password = await bcrypt.hash(req.body.new_password, salt); 

            // proceed to change 
            const result = await storedUser.save();

            console.log("updatePassword result :>", result); 
            
            //
            if (!result){
                return res.status(500).send({
                    statusCode : 500,
                    message:  {
                        en:"Something went wrong", 
                        fr:"Quelque chose s'est mal passé"
                    }
                });
            }

            const emailInfo = {
                pseudo: storedUser.pseudo, 
                email: storedUser.email,
            }

            await sendInfoPasswordChanged(emailInfo); 

            res.send({
                en: 'Success - Password was updated',
                fr: 'Le mot de passe à bien été mis à jour.'
            }); 

        } catch (error) {
            console.log(error);
        }
    },

    deleteAccount : async (req, res) => {
        try {
            const userID = req.session.user.id; 

            const user = await User.findByPk(userID); 

            if (!user) {
                return res.status(404).send({
                    statusCode : 404,
                    message : { // server code 404 : not found
                        en: "User not found.", 
                        fr: "Pas d'utilisateur"
                    }
                }); 
            }

            // A user is found ! 

            const result = await user.delete(); 

            if(!result) {
                return res.status(500).send({
                    statusCode: 500,
                    message: {
                        en: 'Oups, something went wrong',
                        fr: "Aïe, quelque chose s'est mal passé"
                    }
                });
            }

            res.status(200).send(true);
           
        } catch (error) {
            console.log(error);
        }
    }

}

module.exports = profileController ;