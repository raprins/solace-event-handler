
import { EventEmitter } from "@raprincis/utilities"
import { Messaging, MessagingConnectionOptions, MessagingEvents, MessagingOptions, MessagingSubscription } from "./Messaging.js"
import rhea from "rhea"

/**
 * Define AMQP Messaging for Pub/Sub
 */
export default class AMQPMessaging extends EventEmitter<MessagingEvents> implements Messaging {

    private _container: rhea.Container
    private _connection: rhea.Connection

    constructor(private options: MessagingOptions) {
        super()

        this._container = rhea.create_container({
            id: this.options.clientId
        })
    }

    async connect(credential: MessagingConnectionOptions): Promise<void> {

        return new Promise((res, rej) => {

            this._container.once("connection_open", () => {
                this.emit("connected")
                res()
            })
                .on("accepted", () => console.log("Connection accepted >>>"))

            const { hostname: host, port, username, password, clientId: id } = credential

            this._connection = this._container.connect({
                host,
                port,
                username,
                password,
                transport: "tls",
                container_id: this._container.id,
                id
            })
        })
    }

    /**
     * Subscribe to a Particular Topic
     * @param topic 
     * @returns 
     */
    async subscribe(sub: string | MessagingSubscription): Promise<void> {

        const subscription: MessagingSubscription = typeof sub === "string" ? {
            name: sub,
            type: "queue"
        } : sub


        return new Promise((resolve, reject) => {

            this._connection.once("receiver_open", (ctx: rhea.EventContext) => {
                this.emit("subscribed", subscription)
                resolve()
            })


            const address: string = subscription.type === "queue" ? subscription.name : `topic://${subscription.name}`

            const receiver = this._connection.open_receiver({
                //name: "something",
                name: subscription.name,
                source: {
                    address, durable: 2, expiry_policy: 'never'
                }
            })

            receiver.on('message', (context: rhea.EventContext) => {
                if (context.message.body === 'detach') {
                    // detaching leaves the subscription active, so messages sent
                    // while detached are kept until we attach again
                    context.receiver.detach();
                    context.connection.close();
                } else if (context.message.body === 'close') {
                    // closing cancels the subscription
                    context.receiver.close();
                    context.connection.close();
                } else {
                    this.emit("message", {
                        subscription,
                        payload: Buffer.from(context.message.body)
                    })
                }
            })
        })
    }

    unsubscribe(topic: string): Promise<void> {
        throw new Error("Method not implemented.")
    }

    publish(topic: string, message: string): Promise<void> {
        throw new Error("Method not implemented.")
    }
}