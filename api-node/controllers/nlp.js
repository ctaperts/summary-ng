const amqp = require('amqplib/callback_api');
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

function bail(err, conn) {
  console.error(err);
  if (conn) conn.close(function() { process.exit(1); });
}

exports.getText = (req, res) => {
  const exampleDoc = '5d44eaeb5ad27d4c2ec95fa0';
  getOnePostDocPath(exampleDoc)
    .then((postDoc) => {
      res.send(postDoc);
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
