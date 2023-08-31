declare namespace NodeJS {
    export interface ProcessEnv {
        SOLACE_HOSTNAME: string
        SOLACE_MQTT_PORT: string
        SOLACE_AMQP_PORT: string
        SOLACE_USERNAME: string
        SOLACE_PASSWORD: string
        SOLACE_TOPICS: string
    }
}