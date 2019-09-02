const pdfUtility = require('node-ts-ocr');

// const Nlp = require('../models/nlp');
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
  // setup queue names
  const EXCHANGE_NAME = 'nlp';

  // create random message ID
  const correlationId = Math.random().toString(36).substring(2, 15);

  // send message
  mq.channelWrapper(EXCHANGE_NAME).publish(
    EXCHANGE_NAME,
    'nlp.summary',
    new Buffer(JSON.stringify({text: text})),
    {correlationId: correlationId, replyTo: 'nlp.results.summary'},
    (err, done) => {
      if(err) {
        console.log('Message was rejected:', err, 'sent:', done);
      }
    });
  return new Promise(resolve=>{
    const watchChannel = mq.observerChannelResults(correlationId).subscribe(data => {
      if (data) {
        const message = JSON.parse(data.content.toString());
        watchChannel.unsubscribe();
        if (message) {
          resolve(message);
        }
      }
    });
  });
};
