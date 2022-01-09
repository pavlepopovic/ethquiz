const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = mongoose.Schema({
  email: {type: String, required: true, unique: true},
  password: {type: String, required: true},
  tokenCount: {type: Number, required: true}
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('QUser', userSchema);
