const mongoose = require('mongoose');

const matchLobbySchema = mongoose.Schema({
  lobbyStatus: {type : String, required: true}, // ARCHIVED, FORMING, ACTIVE
  userIds: {type: [mongoose.Types.ObjectId], required: true},
  answers: {type: [String], required: true},
  questions: {type: [String], required: true},
  userAnswers: {type: [[String]], required: true},
  numCorrectAnswers: {type : [Number], required: true}
})

module.exports = mongoose.model('MatchLobby', matchLobbySchema);
