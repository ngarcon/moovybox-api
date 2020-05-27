const fs = require('fs'); 

const storecontrollers = async () => {

    const files = await fs.readdirSync(__dirname); 

    const controllers = {}; 

    for (const file of files) {

        const controllerName = file.slice(0, -3); 

        if (controllerName !=='index') {
            controllers[controllerName] = require(`./${controllerName}`) ; 
        }
    }
    
    module.exports = controllers; 
    return; 
}


// = storecontrollers(); 