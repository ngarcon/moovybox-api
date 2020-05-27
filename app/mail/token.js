const jwt = require('jsonwebtoken'); 
require('dotenv').config(); 

const EMAIL_SECRET = process.env.TOKENKEY; 

const payload = {
    pseudo: 'Nico',
    email: 'nicolas.garcon@gmail.com',
    password: 'motdepasse'
}; 

const token = jwt.sign(payload, EMAIL_SECRET,{expiresIn: '1d'}); 
console.log('token :>> ', token);

const isValid = jwt.verify(token, EMAIL_SECRET); 
console.log('isValid :>> ', isValid);

