import { IBlockWorkerMessage } from "../interfaces/block_worker_message.js";
import { QuickNodeBlockGetter } from "./quicknode_block_getter.js";
import { parentPort, workerData } from "worker_threads";
import EthClass from "web3-eth";

if(!workerData || !parentPort) {
    process.exit(1);
}

const blockGetter = new QuickNodeBlockGetter(
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
    workerData.maxRetries,
    //@ts-ignore
    new EthClass(
        //@ts-ignore
        new EthClass.providers.WebsocketProvider(
            workerData.alternateEndpoint,
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
    workerData.rpcTimeout
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
