const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserModel = require('../models/user');

exports.createUser = (req, res) => {
  bcrypt.hash(req.body.password, 10)
    .then(hash => {
      const user = new UserModel({
        email: req.body.email,
        password: hash
      });
      user.save()
        .then(result => {
          res.status(201).json({
            message: 'User Created',
            result: result
          });
        })
        .catch(error => {
          res.status(500).json({
            message: 'Invalid authentication credentials',
            error: error
          });
        });
    });
};

exports.userLogin = (req, res) => {
  let user;
  UserModel.findOne({email: req.body.email})
    .then(userData => {
      if (!userData) {
        return res.status(401).json({
          message: 'Auth failed'
        });
      }
      user = userData;
      return bcrypt.compare(req.body.password, user.password);
    })
    .then(result => {
      if (result !== true) {
        return;
      }
      const token = jwt.sign(
        {email: user.email, userId: user._id},
        process.env.JWT_KEY,
        {expiresIn: '1h'}
      );
      res.status(200).json({
        token: token,
        expiresIn: 3600,
        userId: user._id
      });
    })
    .catch(error => {
      return res.status(401).json({
        message: 'Invalid username or password',
        error: error
      });
    });
};
