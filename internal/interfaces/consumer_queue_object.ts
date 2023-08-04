export interface IConsumerQueueObject<T> {
    message: T, 
    promise?: Promise<void>
}
