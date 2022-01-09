const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');

const userRouter = require('./routes/users');
const matchLobbyRouter = require('./routes/matchLobby');

const app = express();

// # needs to be repalced with %23
const uri = "mongodb+srv://papopov:%2397A%237%235C1%233@cluster0.3hlx5.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
mongoose.connect(uri)
  .then(() => {
  })
  .catch(() => {
    console.log("Connection failed");
  });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : false}));

// for all requests
app.use((req, res, next) => {

  // Disable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Exclude other headers (
  // allow our own header to bypass CORS (Authorization))
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS, PUT');

  next();
})

app.use('/api/users', userRouter);
app.use('/api/matchLobby', matchLobbyRouter);

module.exports = app; // export entire app
