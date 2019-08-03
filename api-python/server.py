#!/home/colby/conda/bin/python3

import json
import pika
import nlp

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

channel.queue_declare(queue='simulations')
channel.queue_declare(queue='results')

#def callback(body):
def callback(ch, method, properties, body):
    requestParams = json.loads(body.decode('utf-8'))
    results = {'results': None}
    if requestParams[0]:
        results = nlp.summarize(requestParams[0])

        # send a message back
    channel.basic_publish(exchange='',
                          routing_key='results',
                          body=json.dumps(results, ensure_ascii=False))

    # connection.close()

#  receive message and complete simulation
channel.basic_consume('simulations', callback)
# channel.basic_consume(callback,
#                   queue='simulations',
#                   no_ack=True)

channel.start_consuming()
