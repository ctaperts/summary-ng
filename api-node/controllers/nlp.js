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

function bail(err, conn) {
  console.error(err);
  if (conn) conn.close(function() { process.exit(1); });
}

exports.getText = (req, res) => {
  const exampleDoc = '5d44eaeb5ad27d4c2ec95fa0';
  getOnePostDocPath(exampleDoc)
    .then((postDoc) => {
      // get filename and check if it is defined
      const fileName = postDoc.split('/')[4];
      if (! fileName) {
        throw new Error();
      }
      const pathToUploads = process.env.UPLOAD_PATH + '/' + fileName;
      getPDFText(pathToUploads)
        .then((result) => {
          res.status(200).json({result});
        });
    })
    .catch((error) => {
      res.status(404).json({
        message: 'File not found, check if file exists or for incorrect path',
        error: error
      });
    });
};

exports.nlp = (req, res) => {
  // console.log(req.body);
  const input = 'hello world';


  function mq(err, conn) {
    if (err !== null) return bail(err, conn);
    conn.createChannel(function (err, ch) {
      if (err !== null) return bail(err, conn);
      const q = 'nlp';
      const resultsQueue = 'results';

      function answer(msg) {
        console.log(msg.content.toString());
        res.send(msg.content.toString());
        ch.close(function() { conn.close(); });
      }

      ch.assertQueue(q, { durable: false }, function(err, ok) {
        if (err !== null) return bail(err, conn);
        const queue = ok.queue;
        ch.consume(resultsQueue, answer, { noAck: true });
        ch.sendToQueue(queue, new Buffer(JSON.stringify(input)));
        setTimeout(function () { conn.close(); }, 100);
      });

    });
  }

  try {
    amqp.connect('amqp://localhost', mq);
  } catch (e) {
    console.error('[AMQP] publish', e.message);
  }
};
