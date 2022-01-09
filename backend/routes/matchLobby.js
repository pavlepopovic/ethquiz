const express = require('express');
const matchLobby = require('../models/matchLobby');
const checkAuth = require('../middleware/checkAuth');

const router = express.Router();

const NUM_PLAYERS_IN_LOBBY = 2;
const NUM_QUESTIONS_PER_GAME = 5;

const QUESTIONS = ['Is Belgrade Capital of Hungary?', 'Is London capital of England?',
  'Did Lewis Hamilton win F1 in 2022?', 'Is Toto Wolff team boss of Mercedes-Amg-F1?', 'Was Mick Jagger member of Beatles?'];
const ANSWERS = ["false", "true", "false", "true", "false"];

router.get('', checkAuth, (req, res, next) => {
  checkForActiveLobby(req, res, next, true);
})

router.post('', checkAuth, (req, res, next) => {
  checkForActiveLobby(req, res, next, false);
})

// Called when user gives up on finding a match
router.put('', checkAuth, (req, res, next) => {
  matchLobby.findOne({lobbyStatus: 'FORMING', userIds : { $elemMatch : {$eq : req.userData.userId}}})
    .then((lobby) => {

      if (!lobby){
        res.status(200).json({ state : 'REMOVED'});
        return;
      }

      let userIds = lobby.userIds;
      for (i = 0; i < NUM_PLAYERS_IN_LOBBY; i++) {
        if (userIds[i] == req.userData.userId) {
          userIds[i] = null;
          break;
        }
      }
      lobby.save()
        .then(() => {
          res.status(200).json({ state : 'REMOVED'});
        })
        .catch((err) => {
          // should not happen
          console.log(err);
          res.status(500).json({message : "Database error: 7"});
        })
    })
    .catch((err) => {
      // should not happen
      console.log(err);
      res.status(500).json({message : "Database error: 6"});
    })
})

// Called when user wishes to give an answer
router.put('/answer', checkAuth, (req, res, next) => {
  // we expect an array here
  const answers = req.body.answers;
  const userId = req.userData.userId;
  matchLobby.findOne({lobbyStatus : 'ACTIVE', userIds : { $elemMatch : {$eq : userId}}, _id : req.body.lobbyId})
    .then((lobby) => {
      if (!lobby) {
        // should never happen
        // can happen right now, because the active lobby shuts itself after some time
        // and users can answer after that - to be fixed
        res.status(500).json({message : "FATAL ERROR: ACTIVE LOBBY DOESNT EXIST"});
        return;
      }
      // find the index of the user
      let userIndex = -1;
      for (i = 0; i < NUM_PLAYERS_IN_LOBBY; i++) {
        if (lobby.userIds[i] == userId) {
          userIndex = i;
          break;
        }
      }

      // make sure that the user didn't answer previously
      for (i = 0; i < NUM_QUESTIONS_PER_GAME; i++) {
        if (lobby.userAnswers[userIndex][i] != 'null') {
          res.status(500).json({message: 'You have already answered'});
          return;
        }
      }

      // compare answers
      let numCorrectAnswers = 0;

      for (i = 0; i < NUM_QUESTIONS_PER_GAME; i++) {
        if (answers[i] == lobby.answers[i]) {
          numCorrectAnswers++;
        }
      }

      // modify the lobby
      lobby.numCorrectAnswers[userIndex] = numCorrectAnswers;

      for (i = 0; i < NUM_QUESTIONS_PER_GAME; i++) {
        lobby.userAnswers[userIndex][i] = answers[i];
      }

      // save the answer in the lobby
      matchLobby.updateOne({_id : lobby._id}, lobby)
        .then((result) => {
          res.status(200).json({message : 'Succesfully saved answer, waiting for others'})
        })
        .catch((err) => {
          res.status(500).json({message : "Database error: 11"});
        })

    })
    .catch(() => {
      res.status(500).json({ message : "Database error: 10"})
    })
})

// Called when user wants to see the results of his game
router.post('/getResults', checkAuth, (req, res, next) => {
  numCorrectAnswers = -1; // this means that the game isn't finished yet
  matchLobby.findOne({lobbyStatus : 'ARCHIVED', _id : req.body.lobbyId})
    .then((lobby) => {
      if (lobby) {
        // find user index
        for (i = 0; i < NUM_PLAYERS_IN_LOBBY; i++) {
          if (lobby.userIds[i] == req.userData.userId) {
            numCorrectAnswers = lobby.numCorrectAnswers[i];
            break;
          }
        }
      }

      res.status(200).json({
        numCorrect: numCorrectAnswers
      })

    })
    .catch((err) => {
      res.status(500).json({
        message : "Database error: 12"
      })
    })
})

function checkForActiveLobby(req, res, next, checkForFormingLobby) {
  matchLobby.findOne({lobbyStatus : 'ACTIVE', userIds : { $elemMatch : {$eq : req.userData.userId}}})
    .then((lobby) => {
      if (!lobby) {
        if (checkForFormingLobby) {
          checkForAFormingLobyWithUser(req, res, next);
        }
        else {
          // send back that an active lobby doesn't exist for the current user
          // we do this to re-fetch questions on page reload
          res.status(200).json({
            state: "NO_QUESTIONS"
          })
        }
        return;
      }
      // found an active lobby, we need to send back questions
      return res.status(200).json({
        state : "SEND_QUESTIONS",
        questions : QUESTIONS,
        id : lobby._id
        })
    })
    .catch(() => {
      return res.status(500).json({message : "Database Error: 1"})
    });
}

function checkForAFormingLobyWithUser(req, res, next) {
  matchLobby.findOne({lobbyStatus: 'FORMING', userIds : { $elemMatch : { $eq : req.userData.userId}}})
  .then((lobby) => {
    if (!lobby) {
      checkForAFormingLobbyToJoin(req, res, next);
      return;
    }

    // signal client that we are waiting, and that he can continue sending get requests
    return res.status(200).json({
      state : "WAITING"
    })
  })
  .catch(() => {
    return res.status(500).json({message : "Database Error: 2"})
  })
}

function checkForAFormingLobbyToJoin(req, res, next) {
  matchLobby.findOne({lobbyStatus: 'FORMING'})
  .then((lobby) => {
    if (!lobby) {
      createNewLobby(req, res, next);
      return;
    }
    for (i = 0; i < NUM_PLAYERS_IN_LOBBY; i++) {
      if (lobby.userIds[i] == null) {
        lobby.userIds[i] = req.userData.userId;
        break;
      }
    }

    canActivate = true;
    for (i = 0; i < NUM_PLAYERS_IN_LOBBY; i++) {
      if (lobby.userIds[i] == null) {
        canActivate = false;
        break;
      }
    }

    if (canActivate) {
      lobby.lobbyStatus = "ACTIVE";
      // lobby can remain active only for some period of time, otherwise it becomes ARCHIVED
      setTimeout(() => {
        lobby.lobbyStatus = "ARCHIVED";
        lobby.save()
          .then(() => {
            // calculate results
            console.log('Lobby is archived');
          })
          .catch(() => {
            console.log("Database error: 8");
          })
      }, 60 * 1000) // a minute
      // todo, query user DB and deduce tokens
    }

    lobby.save()
      .then(() => {
        res.status(200).json({
          state : "WAITING"
        })
      })
      .catch(() => {
        res.status(500).json({message : "Database Error: 3"})
      })
  })
  .catch(() => {
    return res.status(500).json({message : "Database Error: 4"})
  })
}

function createNewLobby(req, res, next) {
  userIds = [];
  userAnswers = [];
  correctAnswers = [];
  userIds.push(req.userData.userId);
  for (i = 1; i < NUM_PLAYERS_IN_LOBBY; i++) {
    userIds.push(null);
  }

  for (i = 0; i < NUM_PLAYERS_IN_LOBBY; i++) {
    correctAnswers.push(0);
    userAnswers.push([]);
    for (j = 0; j < NUM_QUESTIONS_PER_GAME; j++) {
      userAnswers[i].push("null");
    }
  }

  // create a new lobby
  lobby = new matchLobby({
    lobbyStatus : 'FORMING',
    userIds : userIds,
    answers : ANSWERS,
    questions : QUESTIONS,
    userAnswers : userAnswers,
    numCorrectAnswers : correctAnswers
  })

  lobby.save()
    .then(() => {
      res.status(200).json({state : 'WAITING', questions : null});
    })
    .catch(() => {
      res.status(500).json({message : "Database Error: 5"})
    })
}

module.exports = router;

