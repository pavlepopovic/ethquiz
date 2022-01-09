const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const checkNotAuth = require('../middleware/checkNotAuth');

const router = express.Router();

router.post('/login', checkNotAuth, (req, res, next) => {
  User.findOne({email : req.body.email})
    .then((user) => {
      if (!user) {
        res.status(401).json({
          message : "Provided email doesn't exist"
        });
        return;
      }

      bcrypt.compare(req.body.password, user.password)
        .then((compResult) => {
          if (!compResult) {
            res.status(401).json({
              message : "The password for the email doesn't match"
            })
            return;
          }

          // We found the user
          // Send auth token to it
          const jwtToken = jwt.sign({email : user.email, _id : user._id}, "MAKE THIS LONGER", {
            expiresIn : '1h'
          });

          res.status(200).json({
            resEmail : req.body.email,
            _id : user._id,
            resTokenCount : user.tokenCount,
            resJWT : jwtToken,
            resExpiresIn : 3600 // in seconds
          });
        })
    })
    .catch((err) => {
      console.log(err);
      // didn't find the user with the given mail
      res.status(401).json({
        message : "Auth failed!"
      })
    })
})

router.post('/signup', checkNotAuth, (req, res, next) => {
  // we are going to hash passwords
  bcrypt.hash(req.body.password, 10)
    .then((hash) => {
      const user = new User({
        email : req.body.email,
        password : hash,
        tokenCount : 100 // create with initial 100 tokens, subject to change
      });
      user.save()
        .then(() => {
          res.status(201).json({message : "Sucessful signup!"});
        })
        .catch((err) => {
          res.status(500).json({message : "That email already exists, try again"});
        })
    })
});

module.exports = router;
