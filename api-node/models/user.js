const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const authSchema = mongoose.Schema({
  email: {type: String, required: true, unique: true }, // unique is not used for validation but for optimizing in mongodb
  password: {type: String, required: true},
});

authSchema.plugin(uniqueValidator); // validates for unique key in schema

module.exports = mongoose.model('Auth', authSchema);
