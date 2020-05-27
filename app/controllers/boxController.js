const Joi = require('@hapi/joi').extend(require('@hapi/joi-date'));
const Box = require('../models/box');



const boxSchema = Joi.object({
    label: Joi.string()
    .pattern(new RegExp('^[^<>:%]{3,}$'))
    .max(150)
    .required(), 
    destination_room: Joi.string()
    .pattern(new RegExp('^[^<>:%]{3,}$'))
    .max(500)
    .allow(""),
    fragile: Joi.boolean()
    .truthy('on')
    .optional(),
    heavy: Joi.boolean()
    .truthy('on')
    .optional(),
    floor: Joi.boolean()
    .truthy('on')
    .optional(),
    move_id: Joi.number().integer()
    .min(1).required(),
});

const boxController = {
    
    getUserBoxes: async(req,res) => {
        //* Find and send all the boxes from a user
        try {
            
            // At this stage, a middleware has checked user authorization. 
            const boxes = await Box.getAllByUserId(req.session.user.id);
            
            res.send(boxes); 
            
        } catch (error) {
            console.trace(error);
        }
    },
    
    getMoveBoxes: async(req,res) => {
        //* Find and send all the boxes from a user move
        try {
            // At this stage, a middleware has checked user's presence. 
            console.log('req.params :>> ', req.params);
            
            // compare requested move with saved move from user 
            
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
            // We found a matching move id !
            
            const boxes = await Box.getAllFromMove(req.params.id); 
            
            console.log('boxes', boxes)
            
            return res.send(boxes); 
            
        } catch (error) {
            console.trace(error);
        }
    },
    
    createBox: async (req, res) => {
        //* Create a new box in DB
        try {
            
            const payloadValidation = boxSchema.validate(req.body); 
            
            // if an error is found 
            if (!!payloadValidation.error) {
                // abort and send error 400 : bad request
                return res.status(400).send(payloadValidation.error); 
            }
            
            // form is valid !
            
            // Check if the destination move belongs to user
            const move = req.session.user.moves.filter(moveObj => moveObj.id == req.body.move_id); 
            
            // If no move matches
            if (!move.length) {
                // abort and send error 403 : Forbidden action
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
            
            // User is authorized to perform operation ! 
            
            //Compare the label field with the DB values
            const boxLabelMatch = await Box.boxLabelExists(req.body); 
            console.log("boxLabelMatch :>>", boxLabelMatch);
            
            //If the label is the same of the DB value of the same user
            if (boxLabelMatch){
                // send a error to client : 409  COnflict
                return res.status(409).send({
                    error : {
                        statusCode: 409,
                        message: {
                            en:"Conflict - This box label already exists", 
                            fr:"Conflit - Cette étiquette de carton existe déjà"
                        }
                    }
                });
                
            }
            
            // The box label in available for this move ! 
            
            // Add current user_id to payload
            req.body.user_id = req.session.user.id; 
            
            // create an instance of a box
            const newBox = new Box(req.body); 
            
            // Save the current box object to DB
            const storedBox = await newBox.insert(); 
            
            if (!!storedBox) {
                // Content was updated : on search generete a new item
                req.session.user.contentUpdated = true;    
            }   
            
            // Send the newly added box entry to client
            res.send(storedBox);        
            
        } catch (error) {
            console.trace(error);
        }
    }, 
    
    updateBox: async (req, res) => {
        try {
            //* Update the boxes data
            
            console.log('req.body', req.body); 
            
            // check form validity
            const payloadValidation = boxSchema.validate(req.body); 
            
            // if an error is found 
            if (!!payloadValidation.error) {
                // abort and send error 400 : bad request
                return res.status(400).send(payloadValidation.error); 
            }
            
            // form is valid !
            
            // Filter the user moves with the pointed move (from form)
            const move = req.session.user.moves.filter(moveObj => moveObj.id == req.body.move_id); 
            console.log('move from updateBox', move); 
            
            // If the pointed move doesn't belong to current user
            if (!move.length) {
                // prevent action and send an error
                return res.status(403).send({
                    error : {
                        statusCode: 403,
                        message: {
                            en:"Forbidden action - Pointed move doesn't belong to the current user", 
                            fr:"Action interdite - Le déménagement concerné n'appartient pas à l'utilisateur actuel"
                        }
                    }
                });
            }
            
            // User is authorized to perform operation on pointed move ! 
            
            //console.log('req.params.id', req.params.id); 
            
            // Get pointed box from DB 
            const storedBox = await Box.getByPk(req.params.id); 
            
            console.log('storedBox', storedBox); 
            
            if (!storedBox) {
                return res.status(404).send({
                    error : {
                        statusCode: 404,
                        message: {
                            en:"Not found - This box doesn't exists", 
                            fr:"Pas trouvé - Ce carton n'existe pas"
                        }
                    }
                });
            }
            
            // Check if box belongs to user
            if (req.session.user.id != storedBox.user_id) {
                return res.status(403).send({
                    error : {
                        statusCode: 403,
                        message: {
                            en:"Forbidden action - This box doesn't belong to the current user", 
                            fr:"Action interdite - Le carton concerné n'appartient pas à l'utilisateur actuel"
                        }
                    }
                });
            }  
            
            // Box belongs to user ! 
            
            // Update storedBox values prior to update
            for (const prop in req.body) {
                storedBox[prop] = req.body[prop]; 
            }
            
            // Execute request
            const updatedBox = await storedBox.save(); 
            
            // console.log("updateBox", updateBox); 
            
            if (!!updatedBox) {
                // Content was updated : on search generete a new item
                req.session.user.contentUpdated = true;    
            }
            
            // return the updated box
            res.send((!!updatedBox) ? updatedBox : false); 
            
        } catch (error) {
            console.log(error);
        }
    },
    /** */
    deleteBox: async (req, res) => {
        //* Delete a box from DB matching user id
        // At this stage user IS authentified (authCheckerMW.js)
        try {
            // retrieve box from id
            const storedBox = await Box.getByPk(req.params.id); 
            
            // If move belongs to user continue 
            // else send error
            if (!storedBox) {
                return res.status(404).send({
                    error : {
                        statusCode: 404,
                        message: {
                            en:"Not found - This box doesn't exists", 
                            fr:"Pas trouvé - Ce carton n'existe pas"
                        }
                    }
                });
            }
            
            // A box was found 
            
            // Check if box belongs to user
            if (req.session.user.id != storedBox.user_id) {
                return res.status(403).send({
                    error : {
                        statusCode: 403,
                        message: {
                            en:"Forbidden action - This box doesn't belong to the current user", 
                            fr:"Action interdite - Le carton concerné n'appartient pas à l'utilisateur actuel"
                        }
                    }
                });
            }
            
            // Request deletion from DB with move id
            const success = await storedBox.delete(); 
            
            console.log('delete box success', success); 
            
            // return : boolean
            // true : deletion ok
            // false : deletion didn't work
            
            if (!success) {
                return res.status(500).send({
                    statusCode : 500,
                    message:  {
                        en:"Something went wrong", 
                        fr:"Quelque chose s'est mal passé"
                    }
                });
            }
            
            // Content was updated : on search generete a new item
            req.session.user.contentUpdated = true;    
            
            
            return res.status(200).send(true);
            
        } catch (error) {
            console.trace(error);
        }
        
    }
    
}

module.exports = boxController ;