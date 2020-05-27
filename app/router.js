const express = require('express');
const router = express.Router(); 

//const accessHomeMW = require('./middlewares/accessHome'); 
const authCheckerMW = require('./middlewares/authChecker'); 
const boxOptionFillMW = require('./middlewares/boxOptionFill'); 

const mainController = require('./controllers/mainController'); 
const authController = require('./controllers/authController'); 
const profileController = require('./controllers/profileController'); 
const moveController = require('./controllers/moveController');
const boxController = require('./controllers/boxController'); 
const itemController = require('./controllers/itemController'); 


/* ACCES RELATED ROUTES */

// Signup
router.post('/signup', authController.signup);
// Signin
router.post('/signin', authController.signin);
// Signin
router.post('/signout', authController.signout);

// Validate user account
router.get('/confirmation/:token', authController.confirmEmail);
// Resend a confirmation link for email validation
router.post('/reset-token', authController.resetToken);
// Validate request for password renewal
router.put('/profile/reset-password',authController.resetPassword); 


/* 
    TODO : Should redirect towards password renewal page 
*/
router.get('/profile/reset-password/:token', authController.resetPasswordRedirection); 


/* PROFILE RELATED ROUTES */ 

// Update pseudo
router.put('/profile/pseudo', authCheckerMW, profileController.updatePseudo); 
// Change email
// - Request a change of email
router.post('/profile/email', authCheckerMW, profileController.requestEmailUpdate); 
// - Validate change from current email 
router.get('/profile/confirm-email-update/:token',  profileController.confirmEmailUpdate);
// - Validate change from new email and update data
router.get('/profile/confirm-new-email-update/:token',  profileController.updateEmail); 

// Modify user password
router.post('/profile/password', authCheckerMW, profileController.updatePassword);

// delete user account
router.delete('/profile', authCheckerMW, profileController.deleteAccount); 

/* MOVE RELATED ROUTES */

router.route('/move')
    // Get all move from the current user
    .get(authCheckerMW, moveController.getUserMoves) 
    // Create a new move
    .post(authCheckerMW, moveController.createMove);

router.route('/move/:id')
    // Get all boxes in the given move
    .get(authCheckerMW, boxController.getMoveBoxes)
    // Update the data of the pointed move
    .put(authCheckerMW, moveController.updateMove)
    // Delete the pointed move 
    .delete(authCheckerMW, moveController.deleteMove);


/* BOX RELATED ROUTES */

router.route('/box')
    // Get all boxes belonging to the current user
    .get(authCheckerMW, boxController.getUserBoxes)
    // Create a new box
    .post(authCheckerMW, boxOptionFillMW, boxController.createBox); 

router.route('/box/:id')
    // Get all items in the pointed box
    .get(authCheckerMW, itemController.getBoxItems)
    // Update the data of the pointed box
    .put(authCheckerMW, boxOptionFillMW, boxController.updateBox)
    // Delete the pointed box
    .delete(authCheckerMW, boxController.deleteBox);

/* ITEM RELATED ROUTES  */

router.route('/item')
    // Create a new item in a box
    .post(authCheckerMW, itemController.createItem);

router.route('/item/:id')
    // Update the data of the pointed item   
    .put(authCheckerMW, itemController.updateItem)
    // Delete the pointed item   
    .delete(authCheckerMW, itemController.deleteItem);

/* SEARCH */

router.route('/search')
    //! enable "authCheckerMW" middleware after development 
    .get(authCheckerMW, itemController.searchItem);

router.get('/session', (req,res) => {return res.send(req.session.user)});

router.use('*', mainController.notFound); 

module.exports = router; 
