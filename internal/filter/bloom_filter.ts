import { isContractAddressInBloom, isTopicInBloom } from "ethereum-bloom-filters";

/**
 * Bloomfilter class which extends the Bloom filter package, all methods to be implemented here.
 */
export class BloomFilter {
    /**
     * @param {string} bloom - The bloom filter passed
     * @param {string} contractAddress - The address you are looking for
     * 
     * @returns {boolean}
     */
    public static isContractAddressInBloom(bloom: string, contractAddress: string): boolean {
        return isContractAddressInBloom(bloom, contractAddress);
    }

    /**
     * @param {string} bloom - The bloom filter passed
     * @param {string} topic - The topic signature you are looking for
     * 
     * @returns {boolean}
     */
    public static isTopicInBloom(bloom: string, topic: string): boolean {
        return isTopicInBloom(bloom, topic);
    }
}