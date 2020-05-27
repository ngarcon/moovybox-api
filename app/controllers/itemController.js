const Joi = require('@hapi/joi').extend(require('@hapi/joi-date'));
const Box = require('../models/box');
const Item = require('../models/item');

const { normalize } = require('diacritics-normalizr');


const itemSchema = Joi.object({
    name: Joi.string()
    .pattern(new RegExp('^[^<>%]{3,}$')) 
    .min(3)
    .max(150)
    .required(),
    box_id: Joi.number().integer()
    .min(1).required(), 
});

const itemController = {
    
    getBoxItems: async (req,res) => {
        //* Find a send all the item from a user
        try {
            // At this stage, a middleware has checked user authorization. 
            
            // get box id  from params
            const boxId = req.params.id; 
            
            const storedBox = await Box.getByPk(boxId); 
            
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
            
            // A box was found !
            
            const move = req.session.user.moves.filter(moveObj => moveObj.id == storedBox.move_id); 
            
            // If the pointed move doesn't belong to current user
            if (!move.length) {
                // prevent action and send an error
                return res.status(403).send({
                    error : {
                        statusCode: 403,
                        message: {
                            en:"Forbidden action - Pointed box doesn't belong to the current user", 
                            fr:"Action interdite - Le carton concerné n'appartient pas à l'utilisateur actuel"
                        }
                    }
                });
            }
            
            // User is authorized to perform operation on pointed box ! 
            
            // retreive Items connected to box id
            const items = await Item.getAllInBox(storedBox.id); 
            
            res.send(items); 
            
        } catch (error) {
            console.trace(error);
        }
    },
    
    createItem: async (req, res) => {
        //* Create a new item in a box in DB
        try {
            // Validate the data from the form
            const itemValidation = await itemSchema.validate(req.body); 
            
            // if an error is found,
            if (!!itemValidation.error) {
                // update status code (400 for bad request)and send the error details
                res.status(400).send(itemValidation.error); 
            }
            // Form is valid !
            
            const storedBox = await Box.getByPk(req.body.box_id); 
            
            // If no box was found 
            if (!storedBox) {
                // Abort and send error : 404 not found
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
            
            // A box was found !
            
            // If the pointed box doesn't belong to current user
            if (req.session.user.id !== storedBox.user_id) {
                // prevent action and send an error
                return res.status(403).send({
                    error : {
                        statusCode: 403,
                        message: {
                            en:"Forbidden action - Pointed box doesn't belong to the current user", 
                            fr:"Action interdite - Le carton concerné n'appartient pas à l'utilisateur actuel"
                        }
                    }
                });
            }
            
            // User is authorized to perform operation on pointed box ! 
            
            //append user_id to form body
            req.body.user_id = req.session.user.id;
            
            // Check if the item name is available in the destination box
            const itemNameMatch = await Item.itemNameExistsInBox(req.body); 
            
            console.log("itemNameMatch :>>", itemNameMatch);
            
            //If the name already exists inbox 
            if (itemNameMatch){
                // abort and send error : 409 conflict
                return res.status(409).send({
                    error : {
                        statusCode: 409,
                        message: {
                            en:"This item already exists in the destination box.", 
                            fr:"Cet objet existe déjà dans ce carton."
                        }
                    }
                });
                
            } 
            
            // The item name is available in the destination box !
            
            // create an instance of a item
            const newItem = new Item(req.body); 
            console.log('newItem :>> ', newItem);
            
            // Save the current item object to DB
            // Item.insert()
            const storedItem = await newItem.insert(); 
            
            req.session.user.contentUpdated = true; 
            
            // Send the newly added item entry to client
            res.send(storedItem);        
            
            
        } catch (error) {
            console.trace(error);
        }
    }, 
    
    updateItem: async (req, res) => {
        //* Update an item in DB
        try {
            // Validate the data from the form
            const itemValidation = await itemSchema.validate(req.body); 
            
            // if an error is found,
            if (!!itemValidation.error) {
                // update status code (400 for bad request)and send the error details
                res.status(400).send(itemValidation.error); 
            }
            
            // Form is valid !
            
            const storedItem = await Item.getByPk(req.params.id); 
            
            // If no box was found 
            if (!storedItem) {
                // Abort and send error : 404 not found
                return res.status(404).send({
                    error : {
                        statusCode: 404,
                        message: {
                            en:"Not found - This item doesn't exists", 
                            fr:"Pas trouvé - Cet objet n'existe pas"
                        }
                    }
                });
            }
            
            // A box was found !
            
            // If the pointed box doesn't belong to current user
            if (req.session.user.id !== storedItem.user_id) {
                // prevent action and send an error
                return res.status(403).send({
                    error : {
                        statusCode: 403,
                        message: {
                            en:"Forbidden action - Pointed box doesn't belong to the current user", 
                            fr:"Action interdite - Le carton concerné n'appartient pas à l'utilisateur actuel"
                        }
                    }
                });
            }
            
            // User is authorized to perform operation on pointed box ! 
            
            const storedBox = await Box.getByPk(req.body.box_id); 
            
            // If no box was found 
            if (!storedBox) {
                // Abort and send error : 404 not found
                return res.status(404).send({
                    error : {
                        statusCode: 404,
                        message: {
                            en:"Not found - The pointed box doesn't exists", 
                            fr:"Pas trouvé - Le carton concerné par la requête n'existe pas"
                        }
                    }
                });
            }
            
            // A box was found !
            
            // If the pointed box doesn't belong to current user
            if (req.session.user.id !== storedBox.user_id) {
                // prevent action and send an error
                return res.status(403).send({
                    error : {
                        statusCode: 403,
                        message: {
                            en:"Forbidden action - Pointed box doesn't belong to the current user", 
                            fr:"Action interdite - Le carton concerné n'appartient pas à l'utilisateur actuel"
                        }
                    }
                });
            }
            
            // User is authorized to perform operation on pointed box ! 
            
            //append user_id to form body
            req.body.user_id = req.session.user.id;
            
            // Check if the item name is available in the destination box
            const matchedItem = await Item.itemNameExistsInBox(req.body); 
            
            console.log("matchedItem :>>", matchedItem);
            
            //If the name already exists inbox 
            if (!!matchedItem && matchedItem.id !== storedItem.id ){
                // abort and send error : 409 conflict
                return res.status(409).send({
                    error : {
                        statusCode: 409,
                        message: {
                            en:"This item already exists in the destination box.", 
                            fr:"Cet objet existe déjà dans ce carton."
                        }
                    }
                });
                
            } 
            
            // The item name is available in the destination box !
            
            
            // Update storedItem values prior to update
            for (const prop in req.body) {
                storedItem[prop] = req.body[prop]; 
            }
            
            // create an instance of a item
            const updatedItem = await storedItem.update(); 
            console.log('updatedItem :>> ', updatedItem);
            
            req.session.user.contentUpdated = true;             
            
            
            res.send(updatedItem);         
            
        } catch (error) {
            console.trace(error);
        }
    }, 
    
    searchItem: async (req, res) => {
        //* Search item function
        //? query string ?&search=researched+element
        //? payload move_id=15
        try {
            
            console.log('req.query', req.query); 
            
            //? escape special characters ??
            
            //? No data is stored in DB, so we do not see the need for escaping the special characters
            
            //? The is prepared in DB and would prevent SQL script inclusion
            
            console.time("search through");
            
            // Retrieve data from query string 
            const research = await normalize(req.query.research); 
            const {move_id} = req.body; 
            const user_id = req.session.user.id; 
            console.log('move_id', move_id); 
            console.log('research', await normalize(research)); 
            
            // Filter the user moves with the pointed move (from query string)
            const move = req.session.user.moves.filter(moveObj => moveObj.id == move_id)[0];  
            
            // If the pointed move doesn't belong to current user
            if (!move) {
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
            
            console.log('move', move); 
            
            if (req.session.user.contentUpdated || !move.boxes) {
                // Save the move content in the move object
                move.boxes = await Item.search({user_id, move_id}); 
                console.log("On est aller dans la base de données"); 
                req.session.user.contentUpdated = false; 
            }
            
            
            const searchRE = new RegExp(research.trim(), 'i');
            
            const boxesInMove = [...move.boxes]; 
            const itemGroups = []; 
            
            console.log('boxesInMove', boxesInMove); 
            
            for ( const box of boxesInMove) {
                box.labelNormal = await normalize(box.label); 
                box.destination_roomNormal = await normalize(box.destination_room); 
                
                if (!!box.items) {
                    itemGroups.push([...box.items]); 
                    delete box.items; 
                }
            }
            
            
            
            const allItems = [].concat(...itemGroups); 
            
            console.log('searchRE :>> ', searchRE);
            console.log('allItems :>> ', allItems);
            
            // Have a normalized itemName string (removes diacritics : accents)
            for (let item of allItems) {
                item.nameNormal= await normalize(item.name);
            }
            
            const filteredItems =  allItems.filter((item) => searchRE.test(item.nameNormal)); 
            
            console.log('filteredItems', filteredItems);
            
            const startWith = new RegExp(`^${research}`, 'i'); 
            
            // Sort results by item name
            filteredItems.sort((a, b) => a.nameNormal.localeCompare(b.nameNormal));
            
            // Sort again to bring items starting with the given input
            filteredItems.sort((a, b) => (startWith.test(a.nameNormal)) ? -1 : 1); 
            
            // belongings should be grouped by boxes 
            // Repopulate boxes with filter objects 
            for (box of boxesInMove) {
                for (item of filteredItems) {
                    if (item.box_id === box.id) {
                        if (!box.hasOwnProperty('items')) {
                            box.items = []; 
                            box.items.push(item); 
                        } else {
                            box.items.push(item); 
                        }
                    }
                }
            }
            
            //console.log('results', results);
            
            // Filter result box and items to retain the boxes with a matching content
            const filledBoxes = boxesInMove.filter(box => box.hasOwnProperty('items')); 
            
            // Filter boxes ressembling search input on label OR  destination_room ..
            // .. to be included in search results despite having no mathcing items
            const filteredBoxes = boxesInMove.filter( box => searchRE.test(box.labelNormal) || searchRE.test(box.destination_roomNormal)); 
            
            //console.log('filteredBoxes', filteredBoxes);
            
            let boxAlreadyFiltered = false; 
            
            for (const filteredBox of filteredBoxes) {
                // BY default the box is eligible to takepart in the results
                boxAlreadyFiltered = false; 
                // for box matching the research 
                for (const filledBox of filledBoxes) {
                    // if it is already referenced in the result array 
                    if (filteredBox.id == filledBox.id) {
                        // we update 'boxAlreadyFiltered' value to be true
                        boxAlreadyFiltered = true; 
                    }
                }
                
                // If the current empty box matching the results isn't yet refrenced in the final results
                if (!boxAlreadyFiltered) {
                    // we add the current box
                    filledBoxes.push(filteredBox); 
                }
                
            }
            
            const endWithNormal = /Normal$/;
            
            for (const box of filledBoxes) {
                
                for (boxProp in box) {
                    if (endWithNormal.test(boxProp)) {
                        delete box[boxProp]; 
                    } 
                }
                
                if (!!box.items) {
                    for (item of box.items) {
                        for (itemProp in item) {
                            if (endWithNormal.test(itemProp)) {
                                delete item[itemProp]; 
                            } 
                        }
                    }
                }
                
            }

            console.log('final result', filledBoxes);
            /* 
            Returned values example
            [
                Box{items:[{Item},{Item}] }, //item match (name) 
                Box{}        //box match (label OR destination room)
            ]
            */
            console.timeEnd("search through");
            res.send(filledBoxes); 
            
        } catch (error) {
            console.log(error); 
        }
    },
    
    deleteItem: async (req, res) => {
        //* Delete a item from DB matching user id
        // At this stage user IS authentified (authCheckerMW.js)
        try {
            
            // Retrieve item id from url
            const itemId = req.params.id; 
            
            const storedItem = await Item.getByPk(req.params.id); 
            
            // If no box was found 
            if (!storedItem) {
                // Abort and send error : 404 not found
                return res.status(404).send({
                    error : {
                        statusCode: 404,
                        message: {
                            en:"Not found - This item doesn't exists", 
                            fr:"Pas trouvé - Cet objet n'existe pas"
                        }
                    }
                });
            }
            
            // If the pointed box doesn't belong to current user
            if (req.session.user.id !== storedItem.user_id) {
                // prevent action and send an error
                return res.status(403).send({
                    error : {
                        statusCode: 403,
                        message: {
                            en:"Forbidden action - Pointed item doesn't belong to the current user", 
                            fr:"Action interdite - L'objet concerné n'appartient pas à l'utilisateur actuel"
                        }
                    }
                });
            }
            
            // User is authorized to perform operation on pointed box ! 
            
            
            
            // Request deletion from DB
            const success = await storedItem.delete(); 
            
            if (success) {
                req.session.user.contentUpdated = true;    
            }
            
            // return : boolean
            // true : deletion ok
            // false : deletion didn't work
            res.send(success);
            
        } catch (error) {
            console.trace(error);
        }
        
    }
    
}

module.exports = itemController;