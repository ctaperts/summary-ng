const amqp = require('amqp-connection-manager');

// Create a connection manager
var connection = amqp.connect(['amqp://localhost']);
connection.on('connect', function() {
  console.log('Connected to rabbit MQ service');
});
connection.on('disconnect', function(err) {
  console.log('Disconnected. Check if rabbitMQ service is running.', err.stack);
});

module.exports = connection;
