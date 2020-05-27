

const boxOptions = ["fragile", "heavy", "floor"];  

const boxOptionFiller = (req, res, next) => {
    for (data of boxOptions) {

        if (!req.body.hasOwnProperty(data)) {
            req.body[data] = false;
        }
    }

    console.log('req.body in MW :>> ', req.body);
    next(); 
}

module.exports = boxOptionFiller ;