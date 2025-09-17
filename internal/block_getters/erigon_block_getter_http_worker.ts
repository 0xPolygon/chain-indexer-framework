import { IBlockWorkerMessage } from "../interfaces/block_worker_message.js";
import { parentPort, workerData } from "worker_threads";
import { ErigonBlockGetter } from "./erigon_block_getter.js";
import EthClass from "web3-eth";

if (!workerData || !parentPort) {
    process.exit(1);
}

const blockGetter = new ErigonBlockGetter(
    //@ts-ignore
    new EthClass(new EthClass.providers.HttpProvider(workerData.endpoint, {
        headers: [{
            name: "X-ERPC-Secret-Token",
            value: workerData.rpcApiKey ?? ""
        }]
    })), workerData.maxRetries
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
