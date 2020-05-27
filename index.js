const express = require('express');
const session = require('express-session'); 
require('dotenv').config(); 
const PORT = process.env.PORT || 5050; 
const app = express(); 
const cors = require('cors');
const multer = require('multer');

const corsOpts = {

  origin: ['http://localhost:8080', 'http://localhost:5050','http://18.206.96.118'],
  prefligthContinue: false,
  credentials: true, 
  optionsSuccessStatus: 204,
  allowedHeaders : ['Content-Type', 'Authorization', 'Set-Cookie', 'Cookie']
}; 


//app.use(cors(['localhost', '18.206.96.118'])); 
app.use(cors(corsOpts)); 

// Bodyparser for form-data encoded body form
app.use(multer().none()); 

// Bodyparser for encoded body form
app.use(express.urlencoded({extended: true}));

// Bodyparser for json type data
app.use(express.json()); 




app.use(session({
  secret: 'booxxy', // 'keyboard cat' as a default secret would become easy to hack. 
  resave: false,
  saveUninitialized: true,
  cookie: {
    path:'/',
    maxAge: 6*30*24*3600*1000, // fix the life span of the cookie to 6 months (in milliseconds)
    // maxAge: month|days|hours|seconds|milliseconds
    httpOnly: false,
    secure: false, // false : http and https / true : only https 
    sameSite:'none',
  }
})); 

app.use(require('./app/router')); 

app.listen(PORT, _ => console.log("Server running on ", PORT)); 
