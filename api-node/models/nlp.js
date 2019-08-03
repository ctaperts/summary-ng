const mongoose = require('mongoose');

const nlpSchema = mongoose.Schema({
  summary: { type: String },
  topics: [], // review NLP Topic modeling
  highlights: [], // research ways to find highlight sentences
  entities: Map, // Map of entities
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'post', required: true },
});

module.exports = mongoose.model('Nlp', nlpSchema);
