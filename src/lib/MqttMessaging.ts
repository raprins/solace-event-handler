import EventEmitter from "../shared/EventEmitter.js";
import mqtt from "mqtt"
import { MessagingEvents, MessagingOptions, MessagingSubscription } from "./Messaging.js";


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


export default class MqttMessaging extends EventEmitter<MessagingEvents> {

    private _client: mqtt.MqttClient
    private _options: mqtt.IClientOptions

    private constructor(options: MessagingOptions) {
        super()

        const { hostname, port, clientId, username, password } = options

        const host = `wss://${hostname}:${port}`

        this._options = {
            ..._defaultConnectionOptions,
            host,
            username,
            password,
            clientId
        }
    }

    static async create(options: MessagingOptions): Promise<MqttMessaging> {
        const _messaging = new MqttMessaging(options)


        if (options.handlers) {
            const handlerKeys = Object.keys(options.handlers) as Array<keyof MessagingEvents>
            handlerKeys.forEach(key => _messaging.on(key, options.handlers[key]))
        }

        await _messaging.connect()

        if (options.subscriptions) {


            let subscriptions: string[] = []

            if (Array.isArray(options.subscriptions)) {

                subscriptions = options.subscriptions!
                    .map((sub: string | MessagingSubscription) => {
                        return typeof sub === "string" ? sub : sub.subscription
                    })

            } else {
                subscriptions = [options.subscriptions]
            }

            await _messaging.subscribe(subscriptions)
        }

        return _messaging
    }

    async connect(): Promise<void> {



        return new Promise((res, rej) => {

            if (!this._client) {
                this._client = mqtt.connect(this._options.host, this._options)
                this._client.once("connect", (args) => {
                    this.emit("connected")
                    res()
                }).on("message", (topic, payload, packet) => {
                    this.emit("message", {
                        subscription: {
                            subscription: topic,
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
    async subscribe(topic: string | string[]): Promise<void> {

        if (!this._client) {
            await this.connect()
        }

        return new Promise((resolve, reject) => {
            this._client.subscribe(topic, {
                qos: 2
            }, (error, granted) => {
                if (error) {
                    reject()
                } else {
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