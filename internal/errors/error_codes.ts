export const codes = {
    // Base error identifier
    base: { BASE_ERROR: 100 },

    // Coder related errors. 
    coder: {
        UNKNOWN_CODER_ERR: 1000,
        INVALID_PATH_PROTO: 1001,
        INVALID_PATH_TYPE: 1002,
        DECODING_ERROR: 1003,
        ENCODING_VERIFICATION_FAILED: 1004
    },

    // Kafka Consumer error codes. 
    kafkaclient: {
        UNKNOWN_CONSUMER_ERR: 2000,
        CONSUMER_OBSERVER_INVALID: 2001,
        INVALID_CODER_CONFIG: 2002,
        UNKNOWN_PRODUCER_ERR: 3000,
        DELIVERY_TIMED_OUT: 3001
    },

    // Block producer error codes. 
    blockProducer: {
        UNKNOWN_ERR: 4000,
        RECEIPT_NOT_FOUND: 4001,
        OBSERVER_NOT_SET: 4002
    },

    // Event consumer error codes
    eventConsumer: {
        UNKNOWN_ERR: 5000,
        SAVE_EXECUTE_ERROR: 5001,
        MAPPING_ERROR: 5002,
        COMMAND_EXECUTE_ERROR: 5003,
        INVALID_PARAMS_VALIDATION: 5004
    },

    // API Errors
    api: {
        BAD_REQUEST: 400, 
        NOT_FOUND: 404, 
        SERVER_ERROR: 500
    }
};
