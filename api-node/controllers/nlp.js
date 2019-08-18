const pdfUtility = require('node-ts-ocr');

const Post = require('../models/post');
const mq = require('../mq');

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

  // setup queue names
  const QUEUE_NAME = 'nlp';
  const QUEUE_RESULTS_NAME = 'results';

  // create randon message ID
  let messageId = Math.random().toString(36).substring(2, 15);

  // send message
  mq.channelWrapper(QUEUE_NAME).sendToQueue('nlp', new Buffer(JSON.stringify({messageId: messageId, text: text})), (err, done) => {
    if(err) {
      return console.log('Message was rejected:', err, done);
    }
  });

  // subscribe to message and return results when available
  const results = new Promise(function(resolve) {
    const subscribe = mq.observerChannelResults(QUEUE_RESULTS_NAME, messageId).subscribe(o => {
      subscribe.unsubscribe();
      resolve(o);
    });
  });
  return results;
};
