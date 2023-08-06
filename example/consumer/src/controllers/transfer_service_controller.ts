import TransferService from "../services/transfer.js";
import fastify from "fastify";

type getAllTransactionRequest = fastify.FastifyRequest<{
    Querystring: {
        page?: string,
        pageSize?: string,
        userAddress?: string
    }
}>

/**
 * This controller class will have all the functions which will first formal the query params and then
 * pass it to the service function to get the specific data.
 * 
 * @class TransferServiceController
 */
export default class TransferServiceController {
    /**
     * @constructor
     * 
     * @param {TransferService} transferService 
     */
    constructor(public transferService: TransferService) { }

    /**
     * this function will the get all transaction data function in services and first will format all
     * the query params
     * 
     * @param {getAllTransactionRequest} req - request params
     * @param {fastify.FastifyReply} res - result
     * 
     * @returns {Promise<void>}
     */
    async callGetAllTransaction(req: getAllTransactionRequest, res: fastify.FastifyReply): Promise<void> {
        try {
            let { page, pageSize, userAddress } = req.query;
            let condition = {};
            if (!page) {
                page = '0'
            }
            if (!pageSize) {
                pageSize = '100'
            }
            if (userAddress) {
                condition = {
                    ...condition,
                    transactionInitiator: userAddress.toLowerCase()
                }
            }

            res.status(200).send({
                success: true,
                ...(
                    await this.transferService.getAllTransactions(
                        parseInt(page),
                        parseInt(pageSize),
                        condition
                    )
                )
            });
        } catch (error) {
            console.log("error occured", error)
            res.status(400).send({
                success: false,
                error,
            });
        }
    }
}
