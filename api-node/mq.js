const amqp = require('amqp-connection-manager');
const rxjs = require('rxjs');
const Observable = rxjs.Observable;


// Create a connection manager
const connection = amqp.connect(['amqp://localhost']);
connection.on('connect', function() {
  console.log('Connected to rabbit MQ service');
});
connection.on('disconnect', function(err) {
  console.log('Disconnected. Check if rabbitMQ service is running.', err.stack);
});


// Observer results channel and wait for message with random ID
exports.observerChannelResults = (queueResultsName, messageId) => Observable.create((observer) => {
  const channelResultsWrapper = connection.createChannel({
    setup: function(channel) {
      // timeout requests
      setTimeout(function () {
        if (! observer.closed) {
          channel.close();
          observer.next(false);
          observer.complete();
        }
      }, 10000);
      // `channel` here is a regular amqplib `ConfirmChannel`.
      channel.assertQueue(queueResultsName, {durable: false});
      // channel.prefetch(1);
      channel.consume(queueResultsName, function(data) {
        const message = JSON.parse(data.content.toString());
        if (message.messageId === messageId) {
          channelResultsWrapper.ack(data);
          channel.close();
          observer.next(message);
          observer.complete();
        } else {
          // TODO clean up queue when more then x messages or after x time
          console.log('messageId:', message.messageId, 'and', messageId, 'not correct');
        }
      });
    }
  });
});

// send message to queue
exports.channelWrapper = (queueName) => connection.createChannel({
  setup: function(channel) {
    // `channel` here is a regular amqplib `ConfirmChannel`.
    return Promise.all([
      channel.assertQueue(queueName, {durable: false}),
    ]);
  }
});
