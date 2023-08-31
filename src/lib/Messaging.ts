interface Messaging {
    connect: () => Promise<void>
    subscribe: () => Promise<void>
}



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

export type MessagingSubscriptionType = "topic" | "queue"

export type MessagingSubscription = {
    subscription: string,
    type : MessagingSubscriptionType
}

export type MessagingOptions = {
    hostname: string
    port: number
    username: string
    password: string
    clientId: string
    /** Predefined Topic/Queue Subscriptions */
    subscriptions?:  string | string[] | MessagingSubscription[]
    /** Predefined Event Handlers */
    handlers?: Partial<{
        [K in keyof MessagingEvents]: (...args: MessagingEvents[K]) => void
    }>
}


export class MessagingFactory {
}