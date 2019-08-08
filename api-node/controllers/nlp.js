const amqp = require('amqplib/callback_api');
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
  getOnePostDocPath(req.body.docId)
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
            res.status(200).json(result);
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

const nlp = (text) => {
  const messageQueueConnectionString = 'amqp://localhost';
  return new Promise((resolve, reject) => {
    amqp.connect(messageQueueConnectionString, function(err, connection) {
      // timeout and return as error
      setTimeout(function () { reject(connection.close()); }, 10000);
      connection.createChannel(function(err, channel) {
        channel.assertQueue('nlp', { durable: false }, function(err, ok) {
          const queue = ok.queue;
          channel.consume('results', function(msg) {
            channel.close(function() { connection.close(); });
            // return message
            resolve(JSON.parse(msg.content.toString()));
          }, { noAck: true });
          channel.sendToQueue(queue, new Buffer(JSON.stringify(text)));
          if (err) {
            return reject(err);
          }
        });
      });
    });
  });
};
