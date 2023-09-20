export const transferTransactionMessage = {
    "key": "1234",
    "topic": "apps.1.matic.transfer",
    "value": {
        "blockNumber": {
            "high": 0,
            "low": 0,
            "unsigned": true,
        },
        "timestamp": 12340,
        "data": [
            {
                transactionIndex: {
                    "high": 1,
                    "low": 0,
                    "unsigned": true
                },
                transactionHash: "0x0bbd76664f215b0a74d4ee773c85c19cc649dcb504963678db568dca6912f0aa",
                transactionInitiator: "0x65a8f07bd9a8598e1b5b6c0a88f4779dbc077675",
                tokenAddress: "0x8839e639f210b80ffea73aedf51baed8dac04499",
                senderAddress: "0xe95b7d229cfaed717600d64b0d938a36fd5d5060",
                receiverAddress: "0xab6395382798ee6ea6e9a97cdfd18557f34adc87",
                amount: "7954515646169844787673",
            }
        ]
    }
};
