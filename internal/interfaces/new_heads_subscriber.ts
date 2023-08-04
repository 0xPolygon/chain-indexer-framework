import {Observer, Subscription } from "rxjs";
import {IBlockHeader} from  "./block_header.js";

export interface INewHeadsSubscriber {
    createBlockSubscription(subscriber: Observer<IBlockHeader>): Subscription
}
