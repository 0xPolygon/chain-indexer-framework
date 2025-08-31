import { IBlockSubscription } from "../interfaces/block_subscription.js";
import { IBlockGetterWorkerPromise } from "../interfaces/block_getter_worker_promise.js";
import { IBlockWorkerMessage } from "../interfaces/block_worker_message.js";
import { BlockProducerError } from "../errors/block_producer_error.js";
import { BlockGetter } from "../block_getters/block_getter.js";
import { IObserver } from "../interfaces/observer.js";
import { IBlock } from "../interfaces/block.js";
import { Logger } from "../logger/logger.js";
import { Queue } from "../queue/queue.js";
import { Worker } from "worker_threads";
import { createRequire } from "module";

/**
 * A class to produce blocks based on polling using erigon node
 * 
 * @class {ErigonBlockPoller}
 */
export class ErigonBlockPoller extends Queue<IBlockGetterWorkerPromise> implements IBlockSubscription<IBlock, Error> {
    private pollingId?: number;
    private workers: Worker[] = [];
    private processingQueue: boolean = false;
    protected fatalError: boolean = false;
    // @ts-ignore 
    protected observer: IObserver<IBlock, BlockProducerError>; // ts-ignore added for this special case (it will always get initialized in the subscribe method).


    /**
     * @constructor
     * 
     * @param {BlockGetter} blockGetter - BlockGetter module from web3.js
     * @param {number} blockPollingTimeout - The interval we have to poll for new blocks
     */
    constructor(
        protected rpcWsEndpoints: string[] = [],
        private blockGetter: BlockGetter,
        private blockPollingTimeout: number,
        protected maxRetries: number = 0,
    ) {
        super();

        this.setWorkers();
    }

    /**
     * Private method to set workers as per the rpc urls passed.
     * 
     * @returns {void}
     */
    private setWorkers(): void {
        const workers: Worker[] = [];
        const workerPath: string = createRequire(import.meta.url).resolve("../block_getters/erigon_block_getter_http_worker");

        if (!this.rpcWsEndpoints.length) {
            //TODO - throw error if no rpc
            return;
        }

        for (let i = 0; i < this.rpcWsEndpoints.length; i++) {
            const workerData = {
                endpoint: this.rpcWsEndpoints[i],
                maxRetries: this.maxRetries,
                rpcTimeout: this.blockPollingTimeout
            };

            const worker = new Worker(
                workerPath,
                {
                    workerData
                }
            );
            worker.setMaxListeners(1000);

            worker.on("exit", () => {
                this.workers[i] = new Worker(
                    workerPath,
                    {
                        workerData
                    }
                );
                this.workers[i].setMaxListeners(1000);
            });

            workers.push(worker);
        }

        this.workers = workers;
    }

    /**
         * @protected
         * 
         * Protected method that gets the block from a specific worker.
         * 
         * @param {number} blockNumber - Block number to get the block details for 
         * @param {number} workerId - worker Id to which the job must be assigned.
         * 
         * @returns {Promise<IBlock>} - Resolves to give formatted full block. 
         */
    protected getBlockFromWorker(blockNumber: number, workerId: number = 0): Promise<IBlockGetterWorkerPromise> {
        return new Promise(async (resolve) => {
            //Setting callback id to track callbacks replies.
            const callBackId: number = Date.now() + blockNumber;
            const worker = this.workers[workerId!];

            const onMessage = function (value: IBlockWorkerMessage) {
                if (value.callBackId !== callBackId) {
                    return;
                }

                if (value.error) {
                    worker.removeListener("error", onError);
                    worker.removeListener("message", onMessage);

                    return resolve({
                        block: value.block,
                        error: value.error
                    });
                }

                worker.removeListener("error", onError);
                worker.removeListener("message", onMessage);

                return resolve({
                    block: value.block,
                    error: null
                });
            };

            const onError = function (error: Error) {
                worker.removeListener("error", onError);
                worker.removeListener("message", onMessage);

                return resolve({
                    block: {} as IBlock,
                    error: error
                });
            };

            worker.on("message", onMessage);
            worker.on("error", onError);

            worker.postMessage({
                blockNumber,
                callBackId
            });
        });
    }

    /**
     * @async
     * Private method, process queued promises of getBlock, and calls observer.next when resolved.
     * 
     * @returns {Promise<void>}
     */
    private async processQueue(): Promise<void> {
        this.processingQueue = true;
        while (!this.isEmpty() && !this.fatalError && this.observer) {
            try {
                const promiseResult = await (this.shift()) as IBlockGetterWorkerPromise;

                if (promiseResult?.error) {
                    throw promiseResult.error;
                }

                this.observer.next(
                    promiseResult.block
                );
            } catch (error) {
                this.fatalError = true;
                this.observer.error(
                    error instanceof BlockProducerError ? error : BlockProducerError.createUnknown(error)
                );

                break;
            }
        }

        this.processingQueue = false;
    }

    /**
     * The method to start polling for blocks from the start block to finalized block
     *
     * @param {IObserver} observer - The observer object with his functions
     * @param {number} startBlock - Block number to start subscribing from.
     * 
     * @returns {Promise<void>}
     */
    public async subscribe(observer: IObserver<IBlock, Error>, startBlock: number): Promise<void> {
        try {
            this.pollingId = Date.now();
            this.observer = observer;


            //Need to separate the methods, so the subscribe method is not waiting
            //indefinitely for polling to finish.
            this.startBlockPolling(startBlock - 1, this.pollingId);
        } catch (error) {
            observer.error(
                BlockProducerError.createUnknown(error)
            );
        }
    }

    /**
     * Stops the block polling process and kills the active interval from setInterval.
     * 
     * @returns {Promise<boolean>}
     */
    public async unsubscribe(): Promise<boolean> {
        this.pollingId = undefined;
        return true;
    }

    private async startBlockPolling(lastBlockNumber: number, pollingId: number): Promise<void> {
        try {
            while (this.pollingId === pollingId) {
                const latestBlockNumber = await this.blockGetter.getLatestBlockNumber();

                Logger.debug(`Starting polling from block number ${lastBlockNumber} and latest block number is ${latestBlockNumber}`);
                if (latestBlockNumber <= lastBlockNumber) {
                    await new Promise(r => setTimeout(r, this.blockPollingTimeout));
                }

                for (let blockNum: number = (lastBlockNumber + 1); blockNum <= latestBlockNumber && this.pollingId === pollingId; blockNum++) {
                    if (this.getLength() >= this.workers.length * 100) {
                        await new Promise(r => setTimeout(r, 5000));
                    }

                    this.enqueue(this.getBlockFromWorker(blockNum, blockNum % this.workers.length));

                    if (!this.processingQueue) {
                        this.processQueue();
                    }

                    //Added below logic as if a new subscription is created before previous 
                    //promise was resolved, then the block is not emitted.
                    if (this.pollingId !== pollingId) {
                        break;
                    }

                    lastBlockNumber = blockNum;
                }
            }

        } catch (error) {
            this.observer.error(
                BlockProducerError.createUnknown(error)
            );
        }
    }
}
