import { MessagingConnectionOptions, MessagingEventHandlers, MessagingFactory, MessagingOptions, MessagingType } from "../lib/Messaging.js";

const defaultConnection: MessagingConnectionOptions = {
    clientId: 'raprincis',
    hostname: process.env.SOLACE_HOSTNAME,
    port: parseInt(process.env.SOLACE_AMQP_PORT, 10),
    username: process.env.SOLACE_USERNAME,
    password: process.env.SOLACE_PASSWORD,
}

const createHandler  = (messagingType: MessagingType): MessagingEventHandlers => ({
    connected () {
        console.log(`[${messagingType}] - Connected`);
    },
    subscribed({ name, type }) {
        console.log(`[${messagingType}] - Subscribed to ${type} ${name}`)
    },
    message({ subscription, payload }) {
        console.log(`[${messagingType}] - Message happens on ${subscription.name} : ${payload.toString()}`);
    }
})


const amqp = await MessagingFactory.create("AMQP", {
    ...defaultConnection,
    subscriptions: [{
        name: 'myQueue', type: 'queue'
    }, {
        name: 'weather', type: 'topic'
    }],
    handlers: createHandler("AMQP")
})

const mqtt = await MessagingFactory.create("MQTT", {
    ...defaultConnection,
    port: parseInt(process.env.SOLACE_MQTT_PORT, 10),
    subscriptions: ["try-me"],
    handlers: createHandler("MQTT")
})