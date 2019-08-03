const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const postsRoutes = require('./routes/posts');
const userRoutes = require('./routes/user');
const nlpRoutes = require('./routes/nlp');

const app = express();


mongoose.Promise = Promise;

mongoose.connect('mongodb+srv://colby:' + process.env.MONO_ATLAS_PW + '@cluster0-gylxp.mongodb.net/mean-course?retryWrites=true&w=majority')
  .then(() => {
    console.log('Connected to the database');
  })
  .catch((error) => {
    console.log('Connection failed:',
      error.name + '. Possible issues: authentication or connection');
  });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/', express.static(path.join(__dirname, 'angular')));

// can be removed when pushed together
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-allow-Headers', 'Origin, X-requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  next();
});

app.use('/api/posts', postsRoutes);
app.use('/api/user', userRoutes);
app.use('/docs', express.static(path.join(__dirname, 'uploads')));
app.use('/nlp', nlpRoutes);

// for angular node prod setup
// app.use((res) => {
//   res.sendFile(path.join(__dirname, 'angular', 'index.html'));
// });

module.exports = app;
