
import mqtt from "mqtt"
import { Messaging, MessagingConnectionOptions, MessagingEvents, MessagingOptions, MessagingSubscription } from "./Messaging.js";
import { EventEmitter } from "@raprincis/utilities"


const _defaultConnectionOptions: mqtt.IClientOptions = {
    keepalive: 10,
    protocolId: 'MQTT',
    protocolVersion: 4,
    clean: true,
    reconnectPeriod: 1000,
    connectTimeout: 10000,
    will: {
        topic: 'WillMsg',
        payload: Buffer.from('Connection Closed abnormally..!'),
        qos: 0,
        retain: false
    },
    rejectUnauthorized: false
}


export default class MQTTMessaging extends EventEmitter<MessagingEvents> implements Messaging {

    private _client: mqtt.MqttClient
    private _clientOptions: mqtt.IClientOptions

    constructor(private options: MessagingOptions) {
        super()

        const { hostname, port, clientId, username, password } = options

        const host = `wss://${hostname}:${port}`

        this._clientOptions = {
            ..._defaultConnectionOptions,
            host,
            username,
            password,
            clientId
        }
    }

    async connect(credential: MessagingConnectionOptions): Promise<void> {
        return new Promise((res, rej) => {

            if (!this._client) {
                this._client = mqtt.connect(this._clientOptions.host, this._clientOptions)
                this._client
                    .once("connect", (args) => {
                        this.emit("connected")
                        res()
                    }).on("message", (topic, payload, packet) => {
                        this.emit("message", {
                            subscription: {
                                name: topic,
                                type: "topic"
                            },
                            payload
                        })
                    })

            } else {

                if (this._client.connected) {
                    res()
                } else {
                    this._client.connect()
                }
            }
        })
    }

    /**
     * Subscribe to a Particular Topic
     * @param topic 
     * @returns 
     */
    async subscribe(subscription: string | MessagingSubscription): Promise<void> { 
        if (!this._client) {
            await this.connect(this.options)
        }

        return new Promise((resolve, reject) => {
            
            if (typeof subscription !== "string" && subscription.type === "queue") return reject(`Could not Subscribe to a Queue`)

            this._client.subscribe(typeof subscription === "string" ? subscription : subscription.name, {
                qos: 2
            }, (error, granted) => {
                if (error) {
                    reject()
                } else {
                    
                    granted.forEach(({ topic : name }) => {
                        this.emit("subscribed", { name , type : "topic"})
                    })

                    resolve()
                }
            })

        })
    }

    async unsubscribe(topic: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this._client.unsubscribe(topic, (error) => {
                if (error) {
                    reject()
                } else {
                    resolve()
                }
            })
        })
    }

    async publish(topic: string, message: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this._client.publish(topic, message, {
                qos: 2
            }, (error) => {
                if (error) {
                    reject()
                } else {
                    resolve()
                }
            })
        })
    }
}