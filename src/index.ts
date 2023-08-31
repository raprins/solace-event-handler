import { createServer } from "http"
import express, { Request, Response } from "express"
import MqttMessaging from "./lib/MqttMessaging.js"
import AMQPMessaging from "./lib/AmqpMessaging.js"

const app = express()
const httpServer = createServer(app)

const mqttMessaging = await MqttMessaging.create({
    clientId: 'raprincis',
    hostname: process.env.SOLACE_HOSTNAME,
    port: parseInt(process.env.SOLACE_MQTT_PORT, 10),
    username: process.env.SOLACE_USERNAME,
    password: process.env.SOLACE_PASSWORD,
    subscriptions: process.env.SOLACE_TOPICS.split(","),
    handlers: {
        message: ({ subscription, payload }) => {
            console.log("MQTT", subscription.subscription, payload.toString());
        },
        connected: () => {
            console.log("MQTT Connected");
        }
    }
})


const amqpMessaging = await AMQPMessaging.create({
    clientId: 'raprincis',
    hostname: process.env.SOLACE_HOSTNAME,
    port: parseInt(process.env.SOLACE_AMQP_PORT, 10),
    username: process.env.SOLACE_USERNAME,
    password: process.env.SOLACE_PASSWORD,
    subscriptions: [{
        subscription: "myQueue",
        type: "queue"
    }, {
        subscription: "otherQueue",
        type: "queue"
    }],
    handlers: {
        connected: () => {
            console.log("AMQP Connected");
        },
        subscribed: ({ subscription, type }) => {
            console.log("Subscribed in", type, ":", subscription);
        },
        message: ({ subscription, payload }) => {
            console.log("AMQP", subscription.subscription, payload.toString());
        },
    }
})



app.get("/events", (request: Request, response: Response) => {
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    }
    response.writeHead(200, headers)
    const data = `data: Test mic`
    response.write(data)
})

httpServer.listen(3002, () => console.log(`Server is runing correctly`))
