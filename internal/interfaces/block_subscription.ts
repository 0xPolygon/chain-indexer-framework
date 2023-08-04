import { IObserver } from "./observer.js";

export interface IBlockSubscription<T,E> {
    subscribe(observer: IObserver<T, E>, startBlock: number): Promise<void> | void,
    unsubscribe(): Promise<boolean>
}
