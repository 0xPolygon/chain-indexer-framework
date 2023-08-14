export interface IEventProducer<E> {
    emitter: () => Promise<void> | void
    error: (value: E) => void
    closed: () => void
}
