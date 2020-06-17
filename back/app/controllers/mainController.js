const mainController = {

    homePage: (req, res) => {
        
        res.send('home page'); 
    },

    notFound: (req,res) => {
        res.status(404).send('not found'); 
    }
}

module.exports = mainController ;
