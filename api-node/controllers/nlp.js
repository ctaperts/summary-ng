const amqp = require('amqplib/callback_api');

function bail(err, conn) {
  console.error(err);
  if (conn) conn.close(function() { process.exit(1); });
}

exports.nlp = async (req, res) => {
  // console.log(req.body);
  var input = 'hello world';


  function mq(err, conn) {
    if (err !== null) return bail(err, conn);
    conn.createChannel(function (err, ch) {
      if (err !== null) return bail(err, conn);
      var q = 'nlp';
      var resultsQueue = 'results';

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
