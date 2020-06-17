const accessHome = (req, res, next) => {
    // Checker if an authentified user is using the session
    if (!!req.session.user) {
        // if there an authentified user redirect towards his moves page. 
        return res.redirect('/move');
    }

    // if not move on 
    next(); 
}; 

module.exports = accessHome; 