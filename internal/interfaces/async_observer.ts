import { Observer } from "rxjs";

export interface AsyncObserver<T> extends Observer<T> {
   next(): Promise<T> 
   error(error: unknown): void
   complete(): void
}
