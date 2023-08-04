export interface IObserver<T,E> {
    next: (value: T) => Promise<void> | void
    error: (value: E) => void
    closed: () => void
}
