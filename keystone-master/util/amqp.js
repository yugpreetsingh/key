const amqplib = require("amqplib/callback_api");

let ch = null;

amqplib.connect(process.env.AMQP_URI, function(err, conn) {
  console.log("Creating RabbitMQ Channel");
  conn.createChannel(function(err, channel) {
    ch = channel;
  });
});

const amqp = {
  publishToQueue: async (queueName, data) => {
    console.log("Sending data to queue");
    ch.assertQueue(queueName, { durable: false });
    ch.sendToQueue(queueName, new Buffer.from(data));
  }
};

module.exports = amqp;

process.on("exit", code => {
  ch.close();
  console.log(`Closing rabbitmq channel`);
});
