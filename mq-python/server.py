#!/home/colby/conda/bin/python3

import json
import pika
import nlp
try:
    connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
except pika.exceptions.AMQPConnectionError:
    raise SystemExit('Issue connecting to rabbitmq, is it started?')

channel = connection.channel()

channel.exchange_declare(exchange='nlp', exchange_type='topic')

ch_result = channel.queue_declare(queue='', exclusive=True)
queue_name = ch_result.method.queue
channel.queue_bind(exchange='nlp', queue=queue_name, routing_key='nlp.*')

channel.queue_declare(queue='results_queue')
channel.queue_bind(exchange='nlp', queue='results_queue', routing_key='nlp.results.#')

def callback(ch, method, properties, body):
    # print('routing key: ' + method.routing_key)
    # print('correlation id: ' + properties.correlation_id)
    # print('reply to: ' + properties.reply_to)
    try:
        body = json.loads(body.decode("utf-8"))
    except Exception as e:
        print("Could not properly load message: %s" % e)
    results = nlp.summarize(body["text"])
    ch.basic_publish(exchange='nlp',
                     routing_key=(properties.reply_to),
                     properties=pika.BasicProperties(correlation_id=properties.correlation_id),
                     body=json.dumps(results, ensure_ascii=False))
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=False)

print('MQ Waiting for messages...')
try:
    channel.start_consuming()
except KeyboardInterrupt:
    connection.close()
    raise SystemExit('\nKeyboard Interrupt')
