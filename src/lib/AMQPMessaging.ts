import EventEmitter from "../shared/EventEmitter.js"
import { MessagingEvents, MessagingOptions, MessagingSubscription } from "./Messaging.js"
import rhea from "rhea"




export default class AMQPMessaging extends EventEmitter<MessagingEvents> {

    private _container: rhea.Container
    private _connection: rhea.Connection

    private constructor(private options: MessagingOptions) {
        super()

        this._container = rhea.create_container({
            id: this.options.clientId
        })



    }

    static async create(options: MessagingOptions): Promise<AMQPMessaging> {
        const _messaging = new AMQPMessaging(options)

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

            await Promise.all(subscriptions.map(s => _messaging.subscribe(s)))

        }

        return _messaging
    }

    async connect(): Promise<void> {

        return new Promise((res, rej) => {

            this._container.once("connection_open", () => {
                this.emit("connected")
                res()

            })

            this._connection = this._container.connect({
                host: "mr-connection-khfudno04b4.messaging.solace.cloud",
                port: 5671,
                username: this.options.username,
                password: this.options.password,
                transport: "tls",
                container_id: this._container.id
            })

            /*
            this._connection.on('message',  (context: rhea.EventContext) => {
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
                    
                    console.log("AMQP", context.receiver.name);
                    
                }
            })
            */
        })
    }

    /**
     * Subscribe to a Particular Topic
     * @param topic 
     * @returns 
     */
    async subscribe(sub: string | MessagingSubscription): Promise<void> {

        const subscription:MessagingSubscription = typeof sub === "string" ? {
            subscription: sub,
            type : "queue"
        }: sub


        return new Promise((resolve, reject) => {

            this._connection.once("receiver_open", (ctx: rhea.EventContext) => {
                this.emit("subscribed", subscription)
                resolve()
            })


            const address:string = subscription.type === "queue" ? subscription.subscription: `topic://${subscription.subscription}`
            
            const receiver = this._connection.open_receiver({
                //name: "something",
                name: subscription.subscription,
                source: {
                    address, durable: 2, expiry_policy: 'never'
                }
            })

            receiver.on('message',  (context: rhea.EventContext) => {
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
                    
                    console.log("AMQP", context.receiver.name);
                    
                }
            })
            


        })

    }

    async unsubscribe(topic: string): Promise<void> {
        return new Promise((resolve, reject) => {

        })
    }

    async publish(topic: string, message: string): Promise<void> {
        return new Promise((resolve, reject) => {

        })
    }


}