export interface IEventProducer<E> {
    subscribe: () => Promise<void> | void
    error: (value: E) => void
    closed: () => void
}
