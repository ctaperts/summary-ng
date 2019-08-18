// const amqp = require('amqp-connection-manager');
const pdfUtility = require('node-ts-ocr');

const Post = require('../models/post');

async function getOnePostDocPath(postId) {
  let retValue;
  await Post.findById(postId)
    .then(post => {
      if (post) {
        retValue = post.docPath;
      } else {
        retValue = 'Post not found';
      }
    })
    .catch(error => {
      retValue = 'Post not found, error.', error;
    });
  return retValue;
}

async function getPDFText(pdfFile) {
  return await pdfUtility.Ocr.extractText(pdfFile);
}

exports.processText = (req, res) => {
  getOnePostDocPath(req.body.postId)
    .then((postDoc) => {
      // get filename and check if it is defined
      const fileName = postDoc.split('/')[4];
      if (!fileName) {
        throw new Error('Could not find file');
      }
      const pathToUploads = process.env.UPLOAD_PATH + '/' + fileName;
      getPDFText(pathToUploads)
        .then((docText) => {
          nlp(docText).then((result) => {
            res.status(200).json({
              message: 'Successfully process document',
              summary: result
            });
          })
            .catch((error) => {
              res.status(404).json({
                message: 'Error returning processed document',
                error: error
              });
            });
        });
    })
    .catch((error) => {
      res.status(404).json({
        message: 'File not found, check if file exists or for incorrect path',
        error: error
      });
    });
};

const nlp = async (text) => {
  setTimeout(function () { return; }, 10000);

  const messageId = Math.random().toString(36).substring(2, 15);
  const amqp = require('amqp-connection-manager');
  const rxjs = require('rxjs');
  const Observable = rxjs.Observable;
  var QUEUE_NAME = 'nlp';
  // Create a connection manager
  var connection = amqp.connect(['amqp://localhost']);
  connection.on('connect', function() {
    console.log('Connected to rabbit MQ service');
  });
  connection.on('disconnect', function(err) {
    console.log('Disconnected. Check if rabbitMQ service is running.', err.stack);
  });

  const observerChannelResults = Observable.create((observer) => {
    var channelResultsWrapper = connection.createChannel({
      setup: function(channel) {
        // `channel` here is a regular amqplib `ConfirmChannel`.
        channel.assertQueue('results', {durable: false});
        channel.prefetch(1);
        channel.consume('results', function(data) {
          var message = JSON.parse(data.content.toString());
          if (message.messageId === messageId) {
            channelResultsWrapper.ack(data);
            observer.next(message);
            observer.complete();
          }
        });
      }
    });
    channelResultsWrapper.waitForConnect().then(function () {
      console.log('Listening for messages');
    });
  });

  // send message to queue
  var channelWrapper = connection.createChannel({
    setup: function(channel) {
      // `channel` here is a regular amqplib `ConfirmChannel`.
      return Promise.all([
        channel.assertQueue(QUEUE_NAME, {durable: false}),
      ]);
    }
  });
  channelWrapper.sendToQueue('nlp', new Buffer(JSON.stringify({messageId: messageId, text: text})), (err, done) => {
    if(err) {
      return console.log('Message was rejected:', err, done);
    }
  });
  channelWrapper.waitForConnect().then(function () {
    console.log('Listening for messages');
  });
  // subscribe to message and return results when available
  return new Promise(function(resolve) {
    observerChannelResults.subscribe(o => {
      resolve(o);
    });
  });
};
