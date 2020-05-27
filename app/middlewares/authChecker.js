const authChecker = (req, res, next) => {
    // Check if an authentified user is using the session
    if (!req.session.user) {
        // then request  
        return res.status(403).send({
            error : {
                statusCode: 403,
                message: {
                    en:"Unauthorized to perform this action. Sign in and retry", 
                    fr:"Autorisation refusée pour cette opération. Se connecter puis réessayer"
                }
            }
        });
    }
    // if that's the case then move on
    next(); 
    
}; 

module.exports = authChecker; 