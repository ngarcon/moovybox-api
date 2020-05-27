const Joi = require('@hapi/joi');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const Move = require('../models/move'); 
const jwt = require('jsonwebtoken'); 

const configLocal = require('../config'); 

const salt = parseInt(process.env.SALT, 10);
const sendAccountConfirmationEmail= require('../mail/sendAccountConfirmation');

const sendNewAccountConfirmationLinkEmail= require('../mail/sendNewAccountConfirmationLink');
const sendPasswordResetLink = require('../mail/sendPasswordResetLink'); 
require('dotenv').config(); 

const signinSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string()
    .pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$'))
    .required()
});

const signupSchema = Joi.object({
    pseudo: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .allow(" ")
    .required(),
    email: Joi.string()
    .email()
    .required(), 
    password: Joi.string()
    .pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$'))
    .required(),
    // ^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$
    repeat_password: Joi.ref('password'),
}); 

const emailSchema = Joi.object({
    email: Joi.string()
    .email()
    .required()
});

const newPasswordSchema = Joi.object({
    email: Joi.string()
    .email()
    .required(), 
    password: Joi.string()
    .pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$'))
    .required(),
    // ^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$
    repeat_password: Joi.ref('password'),
});

const authControlleur = {
    
    signup: async (req, res) => {
        try {
            // check for entries
            console.log("req.body", req.body); 
            console.log("req.query", req.query); 
            
            // check de validity of the sent data
            const payloadValidation =  await signupSchema.validate(req.body);
            
            // check if the incoming data is valid -> no error
            if (!!payloadValidation.error) {
                // if an error occurs send a bad request code (400) to front
                return res.status(400).send(payloadValidation.error); 
            } 
            
            // Form is acceptable !
            
            console.log('in else');
            // Check if the incoming email isn't already present in DB
            const emailExists = await User.emailExists(req.body.email); 
            
            if (emailExists) {
                // if present : send an error (look for server code) "email already existing in DB" status (409) Conflict
                return res.status(409).send({
                    error : {
                        statusCode: 409,
                        message: {
                            en:"This email already exists", 
                            fr:"Ce mail existe déjà"
                        }
                    }
                }); 
            } 
            
            // Mail is available ! 
            
            req.body.password = await bcrypt.hash(req.body.password, salt); 
            // Creating the object user
            const newUser = new User(req.body); 
            // Save new user in DB 
            const storedUser = await newUser.insert(); 
            console.log('storedUser :>> ', storedUser);
            // Returning the user as an object
            delete storedUser.password; 
            
            // Send email confirmation to the user email
            const emailInfo = {}; 
            const payload = {}; 
            
            // - Retrieve user email
            payload.id = storedUser.id; 
            emailInfo.pseudo = storedUser.pseudo; 
            emailInfo.email = payload.email = storedUser.email; 

            // - Create token with user id and email
            emailInfo.token = jwt.sign(payload, process.env.TOKENKEY, {expiresIn: '1d'}); 
            
            // - Use the email function ({pseudo, email, UserToken})
            sendAccountConfirmationEmail(emailInfo); 
            
            res.status(201).send(storedUser); // Status 201 : resosurces created
            
            
        } catch (error) {
            console.trace(error); 
        }
    },
    
    signin: async (req, res) => {
        
        try {
            
            const payloadValidation = signinSchema.validate(req.body);
            
            if (!!payloadValidation.error){
                return res.status(400).send(payloadValidation.error); 
            }
            // * Get user from email and match passwords 
            
            // I query to get user from DB with email address 
            const storedUser = await User.findByEmail(req.body.email); 
            console.log('storedUser :>> ', storedUser);
            
            // If the user exists  
            if (!storedUser) {
                return res.status(401).send({
                    error : {
                        statusCode: 401,
                        message: {
                            en:"Email not found", 
                            fr:"Email non trouvé"
                        }
                    }
                }); 
            }
            
            // User found with email ! 
            
            // I compare the hash from the DB with the received password (bcrypt)
            // bcrypt.compare(<user password>, <DB hashed password>); 
            const passwordMatch = await bcrypt.compare(req.body.password, storedUser.password); 
            
            console.log('passwordMatch :>> ', passwordMatch);
            
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
            
            // Password is valid
            
            // Check if user has confirmed account
            
            if (!storedUser.confirmed) {
                return res.status(403).send({
                    error : {
                        statusCode: 403,
                        message: {
                            en:"Account is not activated - check email to activate account", 
                            fr:"Le compte n'est pas activé - Vérifier le mail pour activation de compte"
                        }
                    }
                }); 
            }
            
            //   If there is a match add user id to session, 
            
            // AND get his moves and send the results back 
            req.session.user ={ id: storedUser.id }; 
            req.session.user.moves = storedUser.moves = await Move.getAllFromUserId(req.session.user.id); 
            
            // set a content modified value for research update 
            req.session.user.contentUpdated = false; 

            
            console.log('req.session :>> ', req.session);
            
            delete storedUser.password; 
            return res.send(storedUser); 
            
            
            
        }
        catch (err) {
            console.trace(err);
        }
    }, 
    
    confirmEmail: async (req, res) => {
        try {
            // verifiy token 
            const user = jwt.verify(req.params.token, process.env.TOKENKEY); 
            
            if (!!user.id) {
                // Update user state in DB : confirm : false-> true
                const updatedUser = await User.confirmUser(user.id); 
                
                if (!!updatedUser) {
                    // Redirection towards front app signin page 
                    return res.redirect(`${configLocal.frontAppDomain}/signIn`); 
                } else {
                    // Redirection towards front app 404
                    return res.redirect(404, `${configLocal.frontAppDomain}/404`); 
                }
            }
            
        } catch (error) {
            console.trace(error); 
        }
        
    }, 
    
    resetToken : async (req, res) => {
        //* A registred user whose email is not confirmed and his token is outdated
        //* will want to renew the confirmation token to activate his account
        
        try {
            
            const validEmail = emailSchema.validate(req.body); 
            
            if(!!validEmail.error) {
                return res.status(400).send({ // server code 400 : bad request
                    error : {
                        statusCode: 400,
                        message: {
                            en:"The email format is not correct.", 
                            fr:"Le format d'email n'est pas correct."
                        }
                    }
                });
            }
            
            // Retreive user by email 
            const storedUser = await User.findByEmail(req.body.email); 
            
            if (!storedUser) {
                // If no user is found send 404 (not found) error
                return res.status(401).send({
                    error : {
                        statusCode: 401,
                        message: {
                            en:"Email not found", 
                            fr:"Email non trouvé"
                        }
                    }
                }); 
            }
            
            
            if (storedUser.confirmed) {
                // If user exists and account is activated, send error
                return res.status(409).send({ // server code 409 : conflict
                    error : {
                        statusCode: 409,
                        message: {
                            en:"Account already confirmed", 
                            fr:"Ce compte est déjà confirmé"
                        }
                    }
                });
            }
            
            // If user exists and has an unactivated account 
            // -> send New confirmation email
            
            // Removing unecessary password for token creation
            delete storedUser.password; 
            
            // Send email confirmation to the user email
            const confirmationEmailData = {}; 
            
            // - Retrieve user email
            confirmationEmailData.userId = storedUser.id; 
            confirmationEmailData.pseudo = storedUser.pseudo; 
            confirmationEmailData.email = storedUser.email; 
            
            // - Create token with user id, pseudo and email
            confirmationEmailData.token = jwt.sign({id: storedUser.id, email: storedUser.email}, process.env.TOKENKEY, {expiresIn: '1d'}); 
            // - Use the email function ({userPseudo, userEmail, UserToken})
            
            sendNewAccountConfirmationLinkEmail(confirmationEmailData); 
            
            res.status(200).send({ // server code 200 : success
                en: "Success - The new confirmation link has been sent.", 
                fr: "Réussie - Le nouveau lien de confirmation a été envoyé."
            });
            
            
        } catch (error) {
            console.trace(error); 
        }
    }, 
    
    requestNewPassword : async (req, res) => {
        //* Request a new password
        //? paylaod : {email}
        try {
            // find user by email
            const storedUser = await User.findByEmail(req.body.email); 
            
            // if email doesn't exist 
            if (!!storedUser) {
                // abort and send error
                return res.status(401).send({
                    error : {
                        statusCode: 401,
                        message: {
                            en:"Email not found", 
                            fr:"Email non trouvé"
                        }
                    }
                }); 
            }
            
            // Email is stored
            
            delete storedUser.password; 
            delete storedUser.confirmed; 
            
            // if emails exists
            const emailInfo = {
                // prepare a token with obj : (id, pseudo, email)
                pseudo: storedUser.pseudo,
                email: storedUser.email,
                token: await jwt.sign(storedUser, process.env.TOKENKEY, {expiresIn: '1d'})  
            }
            
            // send an email 
            await sendPasswordResetLink(emailInfo); 
            
            res.send({ // server code 200 : success
                en: "Success - The password reset link has been sent to user email.", 
                fr: "Réussie - Le lien de renouvelement de mot de passe a été envoyé adresse de l'utilisateur."
            }); 
            
        } catch (error) {
            console.log(error); 
        }
    }, 
    
    resetPasswordRedirection : async (req, res) => {
        //* Resetting the User password
        //? token :  {email}
        try {
            //
            const payloadValidation = await emailSchema.validate(req.body);
            
            if (!!payloadValidation.error){
                return res.status(400).send(payloadValidation.error); 
            }
            
            // Get user with email
            const storedUser = await User.findByEmail(req.body.email); 
            
            
            if (!storedUser) {
                return res.status(500).send({
                    statusCode : 500,
                    message : { // server code 500 : server error
                        en: "Error - Something went wrong.", 
                        fr: "Aïe - Quelque chose s'est mal passé."
                    }
                }); 
            }
            
            res.redirect(`${configLocal.frontAppDomain}/signIn`); //! SHOULD REDIRECT TO PASSWORD RESET FRONT PAGE 
            
        } catch (error) {
            console.log(error); 
        }
    },
    
    resetPassword: async (req, res) => {
        //* Resetting the User password
        //? Payload : {email, password, repeat_password}
        try {
            //
            const payloadValidation = await newPasswordSchema.validate(req.body);
            
            if (!!payloadValidation.error){
                return res.status(400).send(payloadValidation.error); 
            }
            
            // Get user by email
            const storedUser = await User.findByEmail(req.body.email); 
            
            // Check DB response
            if (!storedUser) {
                return res.status(401).send({
                    error : {
                        statusCode: 401,
                        message: {
                            en:"Email not found", 
                            fr:"Email non trouvé"
                        }
                    }
                }); 
            }
            
            // user is identified ! 
            
            // hash the passwoprd prior to update in DB
            storedUser.password = await bcrypt.hash(req.body.password, salt);
            
            console.log(storedUser); 
            
            // execute update
            const updatedUser = await storedUser.save();
            
            if (!updatedUser) {
                return res.status(500).send({
                    statusCode : 500,
                    message : { // server code 200 : success
                        en: "Error - Something went wrong.", 
                        fr: "Aïe - Quelque chose s'est mal passé."
                    }
                }); 
            }
            
            // data is saved !
            
            res.send(updatedUser); //! SHOULD REDIRECT TO SIGNIN FRONT PAGE 
            
        } catch (error) {
            console.log(error); 
        }
    },
    
    signout: (req, res) => {
        delete req.session;
        res.redirect('/');   
    }
}

module.exports = authControlleur ;