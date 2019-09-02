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
exports.observerChannelResults = (correlationId) => new Observable.create((observer) => {
  const q = 'results_queue';
  connection.createChannel({
    setup: function(channel) {
      channel.consume(q, function(data) {
        if (data) {
          if (data.properties.correlationId === correlationId) {
            channel.ack(data);
            observer.next(data);
            channel.close();
          }
        }
      });
    }
  });
});

// send message to queue
exports.channelWrapper = (exchangeName) => connection.createChannel({
  setup: function(channel) {
    // `channel` here is a regular amqplib `ConfirmChannel`.
    return channel.assertExchange(exchangeName, 'topic', {durable: false});
  }
});
