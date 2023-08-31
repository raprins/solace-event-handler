
type EventHandler<K extends any[]> = (...args: K) => void

export default class EventEmitter<EventMap extends Record<string, any[]>> {

    private _eventHandlers: { [K in keyof EventMap]?: Set<EventHandler<EventMap[K]>> } = {}


    on<K extends keyof EventMap>(eventName: K, handler: EventHandler<EventMap[K]>) {
        const handlers = this._eventHandlers[eventName] ?? new Set()
        handlers.add(handler)
        this._eventHandlers[eventName] = handlers
    }
    emit<K extends keyof EventMap>(eventName: K, ...args: EventMap[K]) {
        const handlers = this._eventHandlers[eventName] ?? new Set()
        handlers.forEach(handler => handler(...args))
    }
}