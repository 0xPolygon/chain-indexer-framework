import { IBlockGetterWorkerPromise } from "../interfaces/block_getter_worker_promise.js";
import { IBlockWorkerMessage } from "../interfaces/block_worker_message.js";
import { AbstractBlockSubscription } from "./abstract_block_subscription.js";
import { BlockProducerError } from "../errors/block_producer_error.js";
import { IBlock } from "../interfaces/block.js";
import { Worker } from "worker_threads";
import { Eth } from "web3-eth";
import { createRequire } from "module";

/**
 * Block subscription class which emits full block data whenever added to chain.
 * The subscription takes care internally to backfill if historical blocks are requested.
 * 
 * @author - Vibhu Rajeev
 */
export class BlockSubscription extends AbstractBlockSubscription {
    private workers: Worker[] = [];

    /**
     * @constructor
     * 
     * @param {Eth} eth - Eth module from web3.js
     * @param {string} rpcWsEndpoints - Array of websocket urls to nodes.
     * @param {number} maxRetries - Number of times to retry on failure before emitting an error.
     * @param {"quicknode_block_getter" | "erigon_block_getter" | "block_getter"} blockGetterType - The type of block getter to be used for this subscription.
     * @param {number} timeout - Timeout for which if there has been no event, connection must be restarted.
     * @param {number} blockDelay - Block delay for chains not having safe blocks
     * @param {number} alternateEndpoint - alternate endpoint which will be used when the logic to fetch transactions fails
     * @param {number} rpcTimeout - time to wait before retrying again
     */
    constructor(
        eth: Eth,
        protected rpcWsEndpoints: string[] = [],
        protected maxRetries: number = 0,
        private blockGetterType: "quicknode_block_getter" | "erigon_block_getter" | "block_getter" = "block_getter",
        timeout?: number,
        blockDelay?: number,
        protected alternateEndpoint?: string,
        protected rpcTimeout?: number
    ) {
        super(eth, timeout, blockDelay);

        this.setWorkers();
    }

    /**
     * Private method to set workers as per the rpc urls passed.
     * 
     * @returns {void}
     */
    private setWorkers(): void {
        const workers: Worker[] = [];
        const workerPath: string = createRequire(import.meta.url).resolve(`../block_getters/${this.blockGetterType}_worker`);

        if (!this.rpcWsEndpoints.length) {
            //TODO - throw error if no rpc
            return;
        }

        for (let i = 0; i < this.rpcWsEndpoints.length; i++) {
            const workerData = {
                endpoint: this.rpcWsEndpoints[i],
                maxRetries: this.maxRetries,
                alternateEndpoint: this.alternateEndpoint ? this.alternateEndpoint : undefined,
                rpcTimeout: this.rpcTimeout 
            };

            const worker = new Worker(
                workerPath,
                {
                    workerData
                }
            );

            worker.on("exit", () => {
                this.workers[i] = new Worker(
                    workerPath,
                    {
                        workerData
                    }
                );
            });

            workers.push(worker);
        }

        this.workers = workers;
    }

    /**
     * Private method to emit blocks upto current finalized block.
     * 
     * @returns {Promise<void>}
     */
    protected async backFillBlocks(): Promise<void> {
        try {
            const backFillingId: number = Date.now();
            this.activeBackFillingId = backFillingId;

            for (let i = 0; i < this.workers.length; i++) {
                this.addWorkerJobToQueue(this.nextBlock + i, i, backFillingId);
            }

            while (this.nextBlock <= this.lastFinalizedBlock && !this.isEmpty()) {
                const promiseResult = await this.shift();

                if (promiseResult?.error) {
                    throw promiseResult.error;
                }

                if (this.activeBackFillingId !== backFillingId || this.fatalError) {
                    return;
                }

                this.observer.next(
                    promiseResult?.block as IBlock
                );

                this.nextBlock = this.nextBlock + 1;
            }

            this.activeBackFillingId = null;
            await this.subscribe(this.observer, this.nextBlock);
        } catch (error) {
            this.activeBackFillingId = null;
            this.fatalError = true;

            if (!this.observer) {
                throw BlockProducerError.createUnknown(error);
            }

            this.observer.error(
                BlockProducerError.createUnknown(error)
            );
        }
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
     * @private
     * 
     * Private method to be only called by backfilling process. This method adds a block promise to queue, 
     * and when a worker fulfills the promise, automatically assigns it to retrieve the next block.
     * 
     * @param {number} blockNumber - Block number to get block details for. 
     * @param {number} workerId - Worker to which the job must be assigned.
     * @param {number} backFillingId - Backfilling Id to identify if the backfilling process is active.
     * 
     * @returns {Promise<void>}
     */
    private async addWorkerJobToQueue(blockNumber: number, workerId: number, backFillingId: number): Promise<void> {
        const blockPromise = this.getBlockFromWorker(
            blockNumber,
            workerId
        );

        this.enqueue(
            blockPromise
        );

        // this part limit the queue length to 2500 and keep on waiting 5 seconds if
        // the length is more than 2500
        if (this.getLength() >= 2500) {
            for (let i = 0; i < 1;) {
                await new Promise(r => setTimeout(r, 5000));
                if (this.getLength() < 2500) {
                    break;
                }
            }
        }

        try {
            await blockPromise;
        } catch {
            // Do nothing as is handled by queue
        }

        if (backFillingId === this.activeBackFillingId && (this.nextBlock + this.getLength() < this.lastFinalizedBlock)) {
            this.addWorkerJobToQueue(
                this.nextBlock + this.getLength() + 1,
                workerId,
                backFillingId
            );
        }
    }
}
