import { IBlockWorkerMessage } from "../interfaces/block_worker_message.js";
import { parentPort, workerData } from "worker_threads";
import { BlockGetter } from "./block_getter.js";
import EthClass from "web3-eth";

if (!workerData || !parentPort) {
    process.exit(1);
}

const blockGetter = new BlockGetter(
    //@ts-ignore
    new EthClass(
        //@ts-ignore
        new EthClass.providers.WebsocketProvider(
            workerData.endpoint,
            {
                reconnect: {
                    auto: true
                },
                clientConfig: {
                    maxReceivedFrameSize: 1000000000,
                    maxReceivedMessageSize: 1000000000,
                },
                timeout: 45000
            }
        )
    ),
    workerData.maxRetries
);

parentPort.on("message", async (message: {
    blockNumber: number,
    callBackId: number
}) => {
    try {
        parentPort?.postMessage(
            {
                callBackId: message.callBackId,
                error: null,
                block: await blockGetter.getBlockWithTransactionReceipts(message.blockNumber)
            } as IBlockWorkerMessage
        );
    } catch (error) {
        parentPort?.postMessage(
            {
                callBackId: message.callBackId,
                error: error
            } as IBlockWorkerMessage
        );
    }
});
