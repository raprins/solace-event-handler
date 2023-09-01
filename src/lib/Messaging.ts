import { EventEmitter } from "@raprincis/utilities";
import AMQPMessaging from "./AMQPMessaging.js";
import MQTTMessaging from "./MQTTMessaging.js";

/**
 * Describe Messaging inner Event
 */
export type MessagingEvents = {
    /** When Messaging is Connected */
    connected: [],
    /** When Subscribed */
    subscribed: [subscription: MessagingSubscription],
    /** When Message happened */
    message: [message: {
        subscription: MessagingSubscription,
        payload: Buffer
    }]
}

export type MessagingConnectionOptions = {
    /** Broker Hostname */
    hostname: string
    /** Broker Port */
    port: number
    /** Username */
    username: string
    /** Password */
    password: string
    /** Unique Id to recognize user */
    clientId: string
}

export type MessagingEventHandlers = Partial<{
    [K in keyof MessagingEvents]: (...args: MessagingEvents[K]) => void
}>

export type MessagingOptions = MessagingConnectionOptions & {
    /** Predefined Topic/Queue Subscriptions */
    subscriptions?: string | string[] | MessagingSubscription[]
    /** Predefined Event Handlers */
    handlers?: MessagingEventHandlers
}

/**
 * Common signature for Messenger
 */
export interface Messaging extends EventEmitter<MessagingEvents> {
    connect(credential: MessagingConnectionOptions): Promise<void>;
    subscribe(subscription: string | MessagingSubscription): Promise<void>;
    unsubscribe(topic: string): Promise<void>;
    publish(topic: string, message: string): Promise<void>;
}


export type MessagingSubscriptionType = "topic" | "queue"

export type MessagingSubscription = {
    name: string,
    type?: MessagingSubscriptionType
}

export type MessagingType = "AMQP" | "MQTT"
export class MessagingFactory {
    static async create(type: MessagingType, options: MessagingOptions): Promise<Messaging> {
        const instance = type === "AMQP" ? new AMQPMessaging(options) : new MQTTMessaging(options)

        if (options.handlers) {
            const handlerKeys = Object.keys(options.handlers) as Array<keyof MessagingEvents>
            handlerKeys.forEach(key => instance.on(key, options.handlers[key]))
        }

        await instance.connect(options)

        if (options.subscriptions) {
            if (typeof options.subscriptions === "string") {
                await instance.subscribe(options.subscriptions)
            } else {
                await Promise.all(options.subscriptions.map(sub => instance.subscribe(sub)))
            }
        }

        return instance
    }
}