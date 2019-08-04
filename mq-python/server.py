#!/home/colby/conda/bin/python3

import json
import pika
import nlp
try:
    connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
except pika.exceptions.AMQPConnectionError:
    raise SystemExit('Issue connecting to rabbitmq, is it started?')

channel = connection.channel()

channel.queue_declare(queue='nlp')
channel.queue_declare(queue='results')

def callback(ch, method, properties, body):
    body = body.decode("utf-8")
    results = nlp.summarize(body)
    channel.basic_publish(exchange='',
                          routing_key='results',
                          body=json.dumps(results, ensure_ascii=False))

channel.basic_consume(queue='nlp', on_message_callback=callback, auto_ack=True)

print('MQ Waiting for messages...')
try:
    channel.start_consuming()
except KeyboardInterrupt:
    connection.close()
    raise SystemExit('\nKeyboard Interrupt')
