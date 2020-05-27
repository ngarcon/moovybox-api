const Joi = require('@hapi/joi').extend(require('@hapi/joi-date'));
const Move = require('../models/move');

const moveSchema = Joi.object({
    label: Joi.string()
    .pattern(new RegExp('^[^<>:%]{3,}$'))
    .max(150)
    .required(), 
    date: Joi.date()
    .format()
    .greater('now')
    .required(), 
    address: Joi.string()
    .pattern(new RegExp('^[^<>:%]{0,}$'))
    .allow("")
    .max(500)

});

const moveController = {
    
    getUserMoves: async(req,res) => {
        //* Find a send all the moves from a user
        try {

            const userId = req.session.user.id; 
            // At this stage, a middleware has checked user authorization. 
            const moves = await Move.getAllFromUserId(userId); 
            
            res.send(moves); 
          
        } catch (error) {
            console.trace(error);
        }
    },
    
    createMove: async (req, res) => {
        //* Create a new move in DB
        try {
            // Validate the data from the form

            const payloadValidation = await moveSchema.validate(req.body);

            console.log('req.body', req.body); 
            
            // if no error found then create Move instance and insert data. 
            if (!!payloadValidation.error) {
                // if an error is found, update status code (400 for bad request)and send the error details
                res.status(400).send(payloadValidation.error); 
            }
            
            // Form is valid
            const moveLabel = req.body.label; 
            const userId = req.session.user.id; 
            
            //Compare the label field with the DB values
            const labelMatch = await Move.labelExists({moveLabel, userId}); 

            //If the label is already in DB for the current user
            if (labelMatch){
                // send a error to client
                return res.status(409).send({
                    error : {
                        statusCode: 409,
                        message: {
                            en:"This label already exists", 
                            fr:"Ce label existe déjà"
                        }
                    }
                });
                
            } 

            // The move label is available for the user !

            // Overload the payload 
            req.body.user_id = userId; 
            
            // create an instance of a move
            const newMove = new Move(req.body); 
            
            // Save the current move object to DB
            const storedMove = await newMove.save(); 
            
            // add the created move in session 
            req.session.user.moves.push(storedMove); 

            // Content was updated : on search generate a new item
            req.session.user.contentUpdated = true; 
            
            // Send the newly added move entry to client
            res.send(storedMove);        

        } catch (error) {
            console.trace(error);
        }
    }, 
    
    updateMove: async (req, res) => {
        //* Update the moves parameters
        
        const matchedMove = req.session.user.moves.filter(moveObj => moveObj.id == req.params.id); 
        
        if (!matchedMove.length) {
            // Abort operation and send error to client;
            return res.status(403).send({
                error : {
                    statusCode: 403,
                    message: {
                        en:"Forbidden action - The requested move doesn't belongs to current user", 
                        fr:"Action interdite - Le déménagement concerné n'appartient pas à l'utilisateur actuel"
                    }
                }
            });
        }
        
        // The move belongs to the user ! 
        
        // Check form validity
        const moveValidation = await moveSchema.validate(req.body); 
        
        // if the form is not valid, 
        if (!!moveValidation.error) {
            // abort operation and send error 400 : bad request
            return res.status(400).send(moveValidation.error); 
        }
        
        // payload is valid !! 
        
        const moveId = req.params.id; 
        
        const move = await Move.getByPk(moveId); 
        
        if (!move) {
            return res.status(404).send({
                error : {
                    statusCode: 404,
                    message: {
                        en:"Move not found", 
                        fr:"Aucun déménagement trouvé"
                    }
                }
            });

        }
        
        // We have a move !

        // Update the current move with paylod values
        for (let prop in req.body) {
            move[prop] = req.body[prop]; 
        }
        
        // Execute request
        const updatedMove = await move.update(); 

        const sessionMove = req.session.user.moves.filter(move => move.id == req.params.id); 

        // update session move with the retun info from DB 
        for (const moveProp in updatedMove) {
            sessionMove[0][moveProp] = updatedMove[moveProp];  
        }

        // Content was updated : on search generate a new item
        req.session.user.contentUpdated = true; 
        
        // return the updated move
        res.send((updatedMove) ? updatedMove : false);
        
    },
    
    deleteMove: async (req, res) => {
        //* Delete a move from DB matching user id
        // At this stage user IS authentified (authCheckerMW.js)
      
        try {                    
            // Filter user move to check if he can use the ressources
            
            const matchedMove = req.session.user.moves.filter(moveObj => moveObj.id == req.params.id); 
            
            if (!matchedMove.length) {
                // Abort operation and send error to client;
                return res.status(403).send({
                    error : {
                        statusCode: 403,
                        message: {
                            en:"Forbidden action - The requested move doesn't belongs to current user", 
                            fr:"Action interdite - Le déménagement concerné n'appartient pas à l'utilisateur actuel"
                        }
                    }
                });
            }
            
            // The pointed move was found !! 

            // get move from DB 
            const moveId = req.params.id; 
            const move = await Move.getByPk(moveId); 
            
            if (!move) {
                return res.status(404).send({
                    error : {
                        statusCode: 404,
                        message: {
                            en:"Move not found", 
                            fr:"Aucun déménagement trouvé"
                        }
                    }
                });
            }
            
            // Request deletion from DB with move id
            const success = await move.delete(); 
            
            if (!success) {
                return res.status(500).send({
                    statusCode : 500,
                    message:  {
                        en:"Something went wrong", 
                        fr:"Quelque chose s'est mal passé"
                    }
                });
            }

            // The move was deleted from DB 
            const sessionMove = req.session.user.moves.filter(entry => entry.id == req.params.id); 

            // get the move object index from session.moves array
            const moveIndexToDelete = req.session.user.moves.indexOf(sessionMove[0])

            // If an idex was found 
            if (moveIndexToDelete >= 0) {
                // Delete the move object from the session.moves array
                req.session.user.moves.splice(moveIndexToDelete, 1); 
            }
            
            return res.status(200).send(success);
        } catch (error) {
            console.trace(error);
        }
        
    }
    
}

module.exports = moveController ;