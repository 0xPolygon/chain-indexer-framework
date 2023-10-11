# Chain Indexer Framework - Blockchain Data Indexer

[![GitHub version](https://badge.fury.io/gh/maticnetwork%2Fchain-indexer-framework.svg)](https://badge.fury.io/gh/maticnetwork%2Fchain-indexer-framework)
![Build Status](https://github.com/0xPolygon/chain-indexer-framework/workflows/CI/badge.svg?branch=main)
[![npm version](https://badge.fury.io/js/%40maticnetwork%2Fchain-indexer-framework.svg)](https://www.npmjs.com/package/@maticnetwork/chain-indexer-framework)
![GitHub](https://img.shields.io/github/license/0xPolygon/chain-indexer-framework)
[![TEST](https://github.com/0xPolygon/chain-indexer-framework/actions/workflows/tests.yml/badge.svg)](https://github.com/0xPolygon/chain-indexer-framework/actions/workflows/tests.yml)


Chain Indexer Framework, is a powerful framework designed for the development of flexible event-driven data pipelines on EVM blockchains. Built on the reliable foundation of Kafka, Chain Indexer Framework empowers developers to build robust and scalable applications that seamlessly process blockchain events and enable real-time data integration.

In today's rapidly evolving blockchain ecosystem, the need for efficient and reliable data processing is paramount. EVM (Ethereum Virtual Machine) blockchains, such as Ethereum itself and its compatible networks, have gained significant traction due to their smart contract capabilities and decentralized nature. However, working with blockchain data at scale and in real time presents unique challenges.

Chain Indexer Framework addresses these challenges by providing a comprehensive Node.js package that simplifies the development of event-driven data pipelines. With its intuitive design and seamless integration with Kafka, one of the most popular and battle-tested distributed streaming platforms, Chain Indexer Framework offers a robust and reliable infrastructure for processing blockchain events efficiently.

## Key Features

- **Event-driven Architecture:** Chain Indexer Framework embraces the power of event-driven architecture, allowing developers to create pipelines that react to blockchain events in real time. By leveraging this approach, applications built with Chain Indexer Framework can easily respond to changes on the blockchain, enabling near-instantaneous data processing.
- **Flexible Data Pipelines:** Chain Indexer Framework offers a flexible and extensible framework for building data pipelines that suit your specific needs. Developers can easily define their desired data flow, including event filtering, transformation, and aggregation, by utilizing the feature set of Chain Indexer Framework.
- **Seamless Integration with Kafka:** As the backbone of Chain Indexer Framework, Kafka provides the necessary infrastructure for handling high-throughput, fault-tolerant, and scalable data streams. Chain Indexer Framework's integration with Kafka ensures reliable data processing and enables seamless interoperability with other Kafka-based systems, further enhancing the versatility of your data pipelines.
- **EVM Blockchain Compatibility:** Chain Indexer Framework is specifically designed for EVM blockchains, enabling developers to harness the power of smart contracts and decentralized applications. Whether you are working with Ethereum or any other EVM-compatible blockchain, Chain Indexer Framework provides a unified and consistent approach to processing blockchain events across different networks. Chain Indexer Framework can also be used for other chains with custom implementations of the provided interfaces and abstract classes.

With Chain Indexer Framework, you can unlock the true potential of EVM blockchains by seamlessly integrating them into your data infrastructure. Whether you are building real-time analytics, decentralized applications, or any other data-driven solution, this documentation will guide you through the intricacies of using Chain Indexer Framework's packages and assist you in developing robust and efficient event-driven data pipelines on EVM blockchains.

## Installation

You can install the package using [NPM](https://www.npmjs.com/package/@maticnetwork/chain-indexer-framework)

### Using NPM

```bash
npm install @maticnetwork/chain-indexer-framework
```

## Usage

```typescript
// Import the chain-indexer-framework module
const chain-indexer-framework = require('@maticnetwork/chain-indexer-framework');
```

You will learn more about usage as we go through the doc below.

## Architecture

Chain Indexer Framework's architecture is composed of three main layers: block producers, transformers, and consumers. Each layer plays a crucial role in processing and transforming blockchain events to facilitate various use cases.

1. **Block Producers:**
Block producers are responsible for publishing raw block data to Kafka topics. This raw block data serves as the primary source of events for all use cases within Chain Indexer Framework. The block producers handle important tasks such as handling blockchain reorganizations (re-orgs) and backfilling of blocks. This ensures that developers only need to focus on specifying the desired RPC (Remote Procedure Call) endpoints they want to provide, without worrying about the intricacies of block management.

By leveraging the block producers, developers can easily connect to blockchain networks, retrieve the latest blocks, and publish them to Kafka topics, establishing a reliable and continuous stream of blockchain events.

2. **Transformers:**
The transformers layer plays a critical role in transforming the raw block data into domain-specific events. These transformers take the raw block data from the Kafka topics and apply various transformations to create meaningful and specialized events. The transformations can encompass a wide range of operations such as data enrichment, filtering, aggregation, or any other processing logic required for a specific use case.

The transformed domain-specific events are then published to their respective Kafka topics, enabling easy replay of events whenever required. This layer allows for flexibility and customization, ensuring that the events generated align with the specific needs of the applications and services built on top of Chain Indexer Framework.

3. **Consumers:**
Consumers are responsible for responding to the events published by the transformers layer. They are designed to receive and process the domain-specific events, triggering actions based on the requirements of the specific service or application. The consumers can be tailored to perform various tasks such as building API endpoints, indexing data to data warehouses for analytics, or notifying events to frontend applications.

By leveraging the events generated by the transformers, consumers can react in real time to changes on the blockchain, enabling seamless integration with other services and systems. This layer empowers developers to build powerful and dynamic applications that respond to blockchain events efficiently.

Together, these three layers form the foundation of Chain Indexer Framework, providing a comprehensive framework for building flexible and scalable event-driven data pipelines on EVM blockchains. Whether it's building real-time analytics, decentralized applications, or any other data-driven solution, Chain Indexer Framework's architecture offers the necessary tools and abstractions to streamline the development process and unlock the full potential of EVM blockchains.

## Examples
To gain a clearer understanding of the entire process, let's consider straightforward [examples](./examples/README.md) 
- First example involves indexing [MATIC transfer](./examples/matic_transfer/README.md) events from the Ethereum blockchain.
- Second example involes indexing NFT Transfer and maintaining [NFT Balance](./examples/nft_balancer/README.md)

Both these examples encompasses all the layers involved, starting from producers, moving through transformers, and concluding with consumers.

## Producers

### Block Producers

Block producers play a critical role in the seamless publishing of raw block data to Kafka topics. It is essential to recognize that each blockchain network has its own unique implementation, and the functionality of Remote Procedure Calls (RPCs) can differ across these networks. In the current implementation, all block producers leverage the SynchronousProducerClass from the Kafka wrapper classes.

Chain Indexer Framework block producers encompass three distinct types of producers, each designed to cater to the specific requirements of different blockchain networks.

1. **BlockPollingProducer**: This producer employs a polling method to continuously check the blockchain for new blocks. If the blockchain is already in sync, it waits for the completion of a predefined timeout before initiating the polling process again. This method is straightforward and involves utilizing basic RPC calls commonly found in every node. Additionally, it serves as an ideal choice when the web socket (wss) node is unavailable for a particular blockchain network.

    ```typescript
    // Import the required module
    import { BlockPollerProducer } from "@maticnetwork/chain-indexer-framework/block_producers/block_polling_producer";

    // Set up and start the Block Poller Producer
    const producer = new BlockPollerProducer({
        startBlock: '<START_BLOCK as number>',
        rpcWsEndpoints: ['<HTTP_PROVIDER_1>', '<HTTP_PROVIDER_2>'],
        blockPollingTimeout: '<BLOCK_POLLING_TIMEOUT as string>',
        topic: '<PRODUCER_TOPIC>',
        maxReOrgDepth: '<MAX_REORG_DEPTH>',
        maxRetries: '<MAX_RETRIES>',
        mongoUrl: '<MONGO_DB_URL>',
        "bootstrap.servers": '<KAFKA_CONNECTION_URL>',
        "security.protocol": "plaintext"
    })

    // Handle fatal error
    producer.on("blockProducer.fatalError", (error) => {
        console.error(`Block producer exited. ${error.message}`);
        process.exit(1); // Exiting process on fatal error. Process manager needs to restart the process.
    });
    
    // Start the producer
    producer.start().catch((error) => {
        console.error(error);
    });


    // Or use the functional API


    // Import the required module
    import { produce } from "@maticnetwork/chain-indexer-framework/kafka/producer/produce";
    import { BlockPollerProducer } from "@maticnetwork/chain-indexer-framework/block_producers/block_polling_producer";

    // Set up the Block Poller Producer
    const producer = produce<BlockPollerProducer>({
        startBlock: '<START_BLOCK as number>',
        rpcWsEndpoints: ['<HTTP_PROVIDER_1>', '<HTTP_PROVIDER_2>'],
        blockPollingTimeout: '<BLOCK_POLLING_TIMEOUT as string>',
        topic: '<PRODUCER_TOPIC>',
        maxReOrgDepth: '<MAX_REORG_DEPTH>',
        maxRetries: '<MAX_RETRIES>',
        mongoUrl: '<MONGO_DB_URL>',
        "bootstrap.servers": '<KAFKA_CONNECTION_URL>',
        "security.protocol": "plaintext",
        blockSubscriptionTimeout: 120000,
        type: 'blocks:poller',
        {
            error: (error: KafkaError | BlockProducerError) => {},
            closed: () => {} // On broker connection closed
        }
    });
    ```

2. **ErigonBlockProducer**: This particular block producer operates by subscribing to blocks through a web socket providers and utilizes an erigon node to produce data for Kafka. What sets the erigon node apart from other nodes is its unique characteristic of not requiring separate calls for obtaining receipts for each transaction. Instead, it efficiently retrieves block details with just two calls: one to retrieve the overall block information and another to fetch all the transaction details within that block. While the former call is commonly used across various nodes, the latter, that used the `eth_getBlockReceipts` method, distinguishes the erigon node from others in the network.

    ```typescript
    // Import the required module
    import { ErigonBlockProducer } from "@maticnetwork/chain-indexer-framework/block_producers/erigon_block_producer";

    // Set up the Erigon Block Producer
    const producer = new ErigonBlockProducer({
        startBlock: '<START_BLOCK as number>',
        rpcWsEndpoints: ['<RPC_WS_ENDPOINT_URL_LIST_1>', '<RPC_WS_ENDPOINT_URL_LIST_2>'],
        blockPollingTimeout: '<BLOCK_POLLING_TIMEOUT as string>',
        topic: '<PRODUCER_TOPIC>',
        maxReOrgDepth: '<MAX_REORG_DEPTH>',
        maxRetries: '<MAX_RETRIES>',
        mongoUrl: '<MONGO_DB_URL>',
        "bootstrap.servers": '<KAFKA_CONNECTION_URL>',
        "security.protocol": "plaintext"
    })

    // Handle fatal error
    producer.on("blockProducer.fatalError", (error) => {
        console.error(`Block producer exited. ${error.message}`);
        process.exit(1); // Exiting process on fatal error. Process manager needs to restart the process.
    });
    
    // Start the producer
    producer.start().catch((error) => {
        console.error(error);
    });


    // Or use the functional API


    // Import the required module
    import { produce } from "@maticnetwork/chain-indexer-framework/kafka/producer/produce";
    import { ErigonBlockProducer } from "@maticnetwork/chain-indexer-framework/block_producers/erigon_block_producer";

    // Set up the Erigon Block Producer
    const producer = produce<ErigonBlockProducer>({
        startBlock: '<START_BLOCK as number>',
        rpcWsEndpoints: ['<HTTP_PROVIDER_1>', '<HTTP_PROVIDER_2>'],
        blockPollingTimeout: '<BLOCK_POLLING_TIMEOUT as string>',
        topic: '<PRODUCER_TOPIC>',
        maxReOrgDepth: '<MAX_REORG_DEPTH>',
        maxRetries: '<MAX_RETRIES>',
        mongoUrl: '<MONGO_DB_URL>',
        "bootstrap.servers": '<KAFKA_CONNECTION_URL>',
        "security.protocol": "plaintext",
        blockSubscriptionTimeout: 120000,
        type: 'blocks:erigon',
        {
            error: (error: KafkaError | BlockProducerError) => {},
            closed: () => {} // On broker connection closed
        }
    });
    ```

3. **QuickNodeBlockProducer**: The highly optimized block producer exclusively runs on QuickNode RPCs, utilizing the same web socket provider. However, what sets it apart is that QuickNode exposes the `qn_getBlockWithReceipts` method, which streamlines the process of retrieving both block details and transaction information within a single call. Unlike the ErigonBlockProducer, which necessitates two separate calls, or the BlockPollingProducer, which requires multiple calls, this method significantly simplifies the data retrieval process. To utilize this producer effectively, it is essential for QuickNode to support the `qn_getBlockWithReceipts` method for the desired chain.

    ```typescript
    // Import the required module
    import { QuickNodeBlockProducer } from "@maticnetwork/chain-indexer-framework/block_producers/quicknode_block_producer";

    // Set up the QuickNode Block Producer
    const producer = new QuickNodeBlockProducer({
        startBlock: '<START_BLOCK as number>',
        rpcWsEndpoints: ['<RPC_WS_ENDPOINT_URL_LIST_1>', '<RPC_WS_ENDPOINT_URL_LIST_2>'],
        blockPollingTimeout: '<BLOCK_POLLING_TIMEOUT as string>',
        topic: '<PRODUCER_TOPIC>',
        maxReOrgDepth: '<MAX_REORG_DEPTH>',
        maxRetries: '<MAX_RETRIES>',
        mongoUrl: '<MONGO_DB_URL>',
        "bootstrap.servers": '<KAFKA_CONNECTION_URL>',
        "security.protocol": "plaintext"
    })

    producer.on("blockProducer.fatalError", (error) => {
        console.error(`Block producer exited. ${error.message}`);
        process.exit(1); // Exiting process on fatal error. Process manager needs to restart the process.
    });

    producer.start().catch((error) => {
        console.error(error);
    });


    // Or use the functional API


    // Import the required module
    import { produce } from "@maticnetwork/chain-indexer-framework/kafka/producer/produce";
    import { QuickNodeBlockProducer } from "@maticnetwork/chain-indexer-framework/block_producers/quicknode_block_producer";

    // Set up the QuickNode Block Producer
    const producer = produce<QuickNodeBlockProducer>({
        startBlock: '<START_BLOCK as number>',
        rpcWsEndpoints: ['<HTTP_PROVIDER_1>', '<HTTP_PROVIDER_2>'],
        blockPollingTimeout: '<BLOCK_POLLING_TIMEOUT as string>',
        topic: '<PRODUCER_TOPIC>',
        maxReOrgDepth: '<MAX_REORG_DEPTH>',
        maxRetries: '<MAX_RETRIES>',
        mongoUrl: '<MONGO_DB_URL>',
        "bootstrap.servers": '<KAFKA_CONNECTION_URL>',
        "security.protocol": "plaintext",
        blockSubscriptionTimeout: 120000,
        type: 'blocks:quicknode',
        {
            error: (error: KafkaError | BlockProducerError) => {},
            closed: () => {} // On broker connection closed
        }
    });

    ```

### Synchronous Producer
    
The **Synchronous Producer** class is recommended when the utmost importance is placed on data integrity and the tolerance for potential delays is higher than the risk of data loss. This class ensures that even if the service encounters downtime or disruptions, it will resume publishing from the exact point it left off. By maintaining a synchronous nature, it guarantees the completion of each message before moving on to the next, prioritizing data integrity and consistency.

```typescript
// Import the required modules
import { SynchronousProducer } from "@maticnetwork/chain-indexer-framework/kafka/producer/synchronous_producer";
import { Coder } from "@maticnetwork/chain-indexer-framework/coder/protobuf_coder";

// Initialize the Kafka producer
const producer = new SynchronousProducer(
    {
        topic: "<PRODUCER_TOPIC>",
        "bootstrap.servers": "<KAFKA_CONNECTION_URL>",
        "security.protocol": "plaintext",
        "message.max.bytes": 26214400,
        coder: {
            fileName: "matic_transfer",
            packageName: "matictransferpackage",
            messageType: "MaticTransferBlock"
        }
    }
);

// Starting the Producer
producer.start();

// Send an event to the Kafka topic
producer.produceEvent("<key: string>", "<message: object>");


// Or use the functional API


// Import the required modules
import { produce } from "@maticnetwork/chain-indexer-framework/kafka/producer/produce";
import { SynchronousProducer } from "@maticnetwork/chain-indexer-framework/kafka/producer/synchronous_producer";

// Initialize and start the Kafka producer
const producer = produce<SynchronousProducer>(
    {
        topic: "<PRODUCER_TOPIC>",
        "bootstrap.servers": "<KAFKA_CONNECTION_URL>",
        "security.protocol": "plaintext",
        "message.max.bytes": 26214400,
        coder: {
            fileName: "matic_transfer",
            packageName: "matictransferpackage",
            messageType: "MaticTransferBlock",
        },
        type: "synchronous", // use 'synchronous'. if synchronous producer is needed
        {
            emitter: () => {
                this.produceEvent("<key: string>", "<message: object>");
            },
            error: (error: KafkaError | BlockProducerError) => {},
            closed: () => {} // On broker connection closed
        }
    }
)
```

### Asynchronous Producer

The **Asynchronous Producer** class is designed for scenarios where maximizing throughput and minimizing latency are paramount. This class prioritizes speed and efficiency by allowing rapid publication of data. However, it should be noted that using the asynchronous approach carries a higher risk of data loss. If the service experiences an interruption, the previous batch will be considered published, even if it wasn't fully transmitted.

```typescript
// Import the required modules
import { AsynchronousProducer } from "@maticnetwork/chain-indexer-framework/kafka/producer/asynchronous_producer";

// Initialize the asynchronous Kafka producer
const producer = new AsynchronousProducer(
    {
        topic: "<PRODUCER_TOPIC>",
        "bootstrap.servers": "<KAFKA_CONNECTION_URL>",
        "security.protocol": "plaintext",
        "message.max.bytes": 26214400,
        coder: {
            fileName: "matic_transfer",
            packageName: "matictransferpackage",
            messageType: "MaticTransferBlock"
        }
    }
);

// Start the producer
producer.start();

// Send an event to the Kafka topic
producer.produceEvent("<key: string>", "<message: object>");


// Or use the functional API


// Import the required modules
import { produce } from "@maticnetwork/chain-indexer-framework/kafka/producer/produce";
import { AsynchronousProducer } from "@maticnetwork/chain-indexer-framework/kafka/producer/asynchronous_producer";

// Initialize and start the Kafka producer
const producer = produce<AsynchronousProducer>(
    {
        topic: "<PRODUCER_TOPIC>",
        "bootstrap.servers": "<KAFKA_CONNECTION_URL>",
        "security.protocol": "plaintext",
        "message.max.bytes": 26214400,
        coder: {
            fileName: "matic_transfer",
            packageName: "matictransferpackage",
            messageType: "MaticTransferBlock"
        },
        type: "asynchronous",
        {
            emitter: () => {
                this.produceEvent("<key: string>", "<message: object>");
            },
            error: (error: KafkaError | BlockProducerError) => {},
            closed: () => {} // On broker connection closed
        }
    }
)
```


## Transformers

Transformers play a vital role as the essential second layer in the architecture, tasked with the crucial task of converting blockchain data into domain-specific events. Each application has its own unique requirements and preferences for event indexing, necessitating the creation of distinct transformers for each event type. These transformers consume the blockchain data produced by the producer layer from Kafka topics, diligently filter the blocks based on the targeted events for indexing, and proceed to transform the data in a manner that aligns with the application's desired storage format. The transformed data is then published to new Kafka topics, specifically dedicated to those specific events. This process ensures that the transformed data is organized and made available exclusively for the intended events, catering to the specific needs of different applications.

The Transformer layer serves as a pivotal component where both the producer and consumer wrapper classes of Kafka are utilized. This layer is composed of three integral parts:

1. Consuming the block events from Kafka that were produced by the Block Producer layer.
2. Mapping and transforming the events/data from the raw block format into a domain-specific structure, tailored to meet the required format or schema.
3. Publishing the transformed and filtered data into the next Kafka topic, enabling the consumer layer to consume and process it.

In the Transformer layer, the data flow starts by consuming the block events previously published to Kafka by the Block Producer layer. These events are then passed through a mapping and transformation process, where the raw block data is converted into a more meaningful and structured format. This transformation ensures that the data aligns with the specific requirements of the domain or application.

Once the data is transformed and mapped appropriately, it is published to the next Kafka topic, making it readily available for consumption by the consumer layer. This enables downstream systems or processes to retrieve and utilize the transformed data, leveraging it for various purposes such as analytics, further processing, or storage.

In summary, the Transformer layer acts as a vital intermediary in the data pipeline, facilitating the consumption of block events, their transformation into a domain-specific format, and the subsequent publication of the transformed data for consumption by downstream components.

```typescript
import { SynchronousDataTransformer } from "@maticnetwork/chain-indexer-framework/data_transformation/synchronous_data_transformer";
import { IConsumerConfig } from "@maticnetwork/chain-indexer-framework/interfaces/consumer_config";
import { IProducerConfig } from "@maticnetwork/chain-indexer-framework/interfaces/producer_config";
import { ITransformedBlock } from "@maticnetwork/chain-indexer-framework/interfaces/transformed_block";

// <T> is the consuming data type interface
// <Y> is the producer data type interface
export class TransformerClass extends SynchronousDataTransformer<T, Y> {
    constructor(consumerConfig: IConsumerConfig, producerConfig: IProducerConfig) {
        super(consumerConfig, producerConfig);
    }

    protected async transform(block: T): Promise<ITransformedBlock<Y>> {
        return {
            blockNumber: block.number,
            timestamp: block.timestamp,
            data: this.map(block)
        };
    }

    private map(block: IBlock): Y[] {
        let transformedData: Y[] = [];

        block.transactions.forEach((transaction: ITransaction) => {
            // Here logic can be changed based on the application requirement 
            // and even based on the domain event that is transformed
            const getFormattedTransaction = transform_X_to_Y_Function(transaction);
            transformedData = transformedData.concat(getFormattedTransaction);
        });

        return transformedData;
    }
}

let transformer = new TransformerClass({...consumerConfig}, {...producerConfig});
transformer.start();

// or you can use the functional implementation

// Import the required modules
import transform from "@maticnetwork/chain-indexer-framework/data_transformation/transform";

// Configure the trasnformer
transform(
    {
        consumerConfig, // consumer config object
        producerConfig, // producer config object
        type: 'asynchronous'
    },
    {
        transform: () => {},
        error: () => {}
    }
);

```

## Consumers

### Synchronous Consumer
    
The **Synchronous Consumer** class is the preferred option when ensuring data integrity and avoiding any loss is of paramount importance, even if it means sacrificing speed. With this class, each event is consumed in a synchronous manner, guaranteeing that no data is missed or left unprocessed. By prioritizing reliability, it provides a slower but more dependable consumption process.

```typescript
// Import the required modules
import { SynchronousConsumer } from "@maticnetwork/chain-indexer-framework/kafka/consumer/synchronous_consumer";
import { Coder } from "@maticnetwork/chain-indexer-framework/coder/protobuf_coder";

// Initialize the synchronous Kafka consumer
const consumer = new SynchronousConsumer(
    {
        "bootstrap.servers": '<KAFKA_CONNECTION_URL>',
        "group.id": '<GROUP_ID>',
        "security.protocol": "plaintext",
        "message.max.bytes": 26214400,
        "fetch.message.max.bytes": 26214400,
        topic: '<CONSUMER_TOPIC>',
        coders: {
            fileName: "block",
            packageName: "blockpackage",
            messageType: "Block"
        }
    }
);

// Start the consumer
consumer.start({
    next: () => {},
    error: () => {},
    closed: () => {}
});

// or you can use the functional implementation

// Import the required modules
import { consume } from "@maticnetwork/chain-indexer-framework/kafka/consumer/consume";
import { Coder } from "@maticnetwork/chain-indexer-framework/coder/protobuf_coder";

// Configure the Kafka consumer
consume(
    {
        "metadata.broker.list": '<KAFKA_CONNECTION_URL>',
        "group.id": '<GROUP_ID>',
        "security.protocol": "plaintext",
        "topic": '<CONSUMER_TOPIC>',
        "coderConfig": {
            fileName: "block",
            packageName: "blockpackage",
            messageType: "Block"
        },
        type: 'synchronous'
    },
    {
        next: () => {},
        error: () => {},
        closed: () => {}
    }
);
```

### Asynchronous Consumer

The **Asynchronous Consumer** class is designed for scenarios where the speed of data consumption takes precedence over potential data loss. If the timely processing of events is critical and the occasional loss of some events is acceptable within defined limits, the asynchronous approach offers enhanced performance. By consuming events in a non-blocking manner, it allows for faster processing and higher throughput, albeit with a higher risk of occasional data loss.

```typescript
// Import the required modules
import { AsynchronousConsumer } from "@maticnetwork/chain-indexer-framework/kafka/consumer/asynchronous_consumer";
import { Coder } from "@maticnetwork/chain-indexer-framework/coder/protobuf_coder";

// Initialize the asynchronous Kafka consumer
const consumer = new AsynchronousConsumer(
    {
        "bootstrap.servers": '<KAFKA_CONNECTION_URL>',
        "group.id": '<GROUP_ID>',
        "security.protocol": "plaintext",
        "message.max.bytes": 26214400,
        "fetch.message.max.bytes": 26214400,
        topic: '<CONSUMER_TOPIC>',
        coders: {
            fileName: "block",
            packageName: "blockpackage",
            messageType: "Block"
        }
    }
);

// Start the consumer
consumer.start({
    next: () => {},
    error: () => {},
    closed: () => {}
});
```


The final layer of the architecture possesses both simplicity and intelligence. It can be considered "dumb" in the sense that it directly consumes Kafka topics generated by the transformers and saves them into the database without any modification. On the other hand, it demonstrates its intelligence by managing reorganization processes. This layer monitors the event stream for blocks, and if a block appears again, it recognizes it as a reorganization event and updates the database accordingly. Additionally, this layer exposes an endpoint that can be accessed by clients. When called, the endpoint queries the database to retrieve the required data and sends it back to the client. It is worth mentioning that this layer has the capability to consume multiple Kafka topics from the transformer layer and update the database accordingly. To facilitate event consumption, it employs a consumer wrapper class from Kafka.

```typescript
import { SynchronousConsumer } from "@maticnetwork/chain-indexer-framework/kafka/consumer/synchronous_consumer";
import { DeserialisedMessage } from "@maticnetwork/chain-indexer-framework/interfaces/deserialised_kafka_message";
import { ITransformedBlock } from "@maticnetwork/chain-indexer-framework/interfaces/transformed_block";

export class ConsumerClass {
    constructor(
        consumer1: SynchronousConsumer,
        consumer2: SynchronousConsumer,
        serviceClass: CustomServiceClass // Replace '<CUSTOM_SERVICE_CLASS>' with the actual CustomServiceClass type
    ) {
        this.consumer1 = consumer1;
        this.consumer2 = consumer2;
        this.serviceClass = serviceClass;
    }

    public async execute(): Promise<void> {
        await this.consumer1.start({
            next: this.onConsumer1Data.bind(this),
            error(err: Error) {
                Logger.error('something wrong occurred: ' + err);
            },
            closed: () => {
                Logger.info('subscription is ended');
                this.onFatalError(new Error("Consumer stopped."));
            },
        });

        await this.consumer2.start({
            next: this.onConsumer2Data.bind(this),
            error(err: Error) {
                Logger.error('something wrong occurred: ' + err);
            },
            closed: () => {
                Logger.info('subscription is ended');
                this.onFatalError(new Error("Consumer stopped."));
            },
        });
    }

    private async onConsumer1Data(message: DeserialisedMessage): Promise<void> {
        const transformedBlock = message.value as ITransformedBlock<TYPE>; // Replace 'TYPE' with the actual data type for Consumer 1
        if (transformedBlock.data && transformedBlock.data.length > 0) {
            // This service class is used to add data to the DB and also exposes
            // functions to call the DB for API calls.
            await this.serviceClass.save(transformedBlock);
        }
    }

    private async onConsumer2Data(message: DeserialisedMessage): Promise<void> {
        // Implement the data processing logic for Consumer 2 here
        // Similar to onConsumer1Data, you can use this.serviceClass to interact with the DB
    }

    private onFatalError(error: Error): void {
        Logger.error(`Consumer encountered a fatal error: ${error.message}`);
        process.exit(1); // Exiting process on fatal error. Process manager needs to restart the process.
    }
}

// Replace '<CONSUMER_1>', '<CONSUMER_2>', and '<SERVICE>' with actual instances of SynchronousConsumer and CustomServiceClass respectively.
// You should create instances of SynchronousConsumer and CustomServiceClass with proper configurations before passing them to ConsumerClass constructor.

let consumer1 = new SynchronousConsumer(/*...*/); // Configure consumer1 with appropriate settings and topic
let consumer2 = new SynchronousConsumer(/*...*/); // Configure consumer2 with appropriate settings and topic
let service = new CustomServiceClass(/*...*/); // Replace CustomServiceClass with your actual service class and configure it accordingly

let consumer = new ConsumerClass(consumer1, consumer2, service);
consumer.execute();


// or you can use the functional implementation

import { ITransformedBlock } from "@maticnetwork/chain-indexer-framework/interfaces/transformed_block";
import { DeserialisedMessage } from "@maticnetwork/chain-indexer-framework/interfaces/deserialised_kafka_message";
import { consume } from "@maticnetwork/chain-indexer-framework/kafka/consumer/consume";
import transferService from "path_to_service_file";

// Configure your consumerConfig object with the required Kafka settings and topic.
// For example:
const consumerConfig = {
    "metadata.broker.list": "<BROKER_LIST>",
    "group.id": "<GROUP_ID>",
    "security.protocol": "plaintext",
    "topic": "<CONSUMER_TOPIC>",
    "coderConfig": {
        fileName: "block",
        packageName: "blockpackage",
        messageType: "Block",
    },
    type: "synchronous"
};

// Start consuming messages from the Kafka topic.
consume(consumerConfig, {
    next: async (message: DeserialisedMessage) => {
        const transformedBlock = message.value as ITransformedBlock<TYPE>; // Replace 'TYPE' with the actual data type for the transformed block.

        if (transformedBlock.data && transformedBlock.data.length > 0) {
            // Use the transferService to save the data to the database or perform other operations.
            await transferService.save(transformedBlock);
        }
    },
    error: (err: Error) => {
        console.error('Something wrong occurred: ' + err);
    },
    closed: () => {
        Logger.info(`Subscription is ended.`);
        throw new Error("Consumer stopped.");
    }
});


```

## Helpers

### Database

The Database class is a singleton class that provides a simple and straightforward method to connect and disconnect from a database with a particular collection. It is designed to work with Mongoose, a popular MongoDB object modeling tool for Node.js. The class is initialized with a database URL, and it manages the connection state and creation of models for the database.

The `Database` class encapsulates the following key functionalities:

1. **Singleton Pattern**: The class follows the Singleton design pattern to ensure that only one instance of the database connection exists throughout the application.

2. **Database Connection**: The class handles the connection to the database specified by the provided URL.

3. **Connection Status**: It allows checking the connection status and ensures that no unnecessary connections are established.

4. **Model Creation**: The class provides a method to define and retrieve Mongoose models associated with a specific collection.

```typescript
import { Database } from "@maticnetwork/chain-indexer-framework/mongo/database";

// Create an instance of the Database class
const database = new Database("mongodb://localhost/mydatabase");

// Connect to the database
await database.connect();

// Define a Mongoose schema
const userSchema = new Schema({
    name: String,
    age: Number,
});

// Create a Mongoose model for the "users" collection
const UserModel = database.model("User", userSchema, "users");

// Perform database operations using the UserModel
// ...

// Disconnect from the database when done
await database.disconnect();
```

### Logger

The Logger class is a singleton class designed to provide a centralized and straightforward approach to log application events. It utilizes the winston library, a popular logging tool for Node.js, and integrates with Sentry for error reporting and DataDog for log aggregation. The class allows developers to create a singleton logger instance with custom configurations and log events at various severity levels, such as "info," "debug," "error," and "warn."

```typescript
// Import the Logger class and LoggerConfig interface
import { Logger } from "@maticnetwork/chain-indexer-framework/logger/logger";

// Configuration for the logger
const loggerConfig = {
    console: {
        level: "debug", // Log all messages with severity level "debug" and above to the console
    },
    sentry: {
        dsn: "your-sentry-dsn", // Sentry DSN for error reporting
        level: "error", // Log messages with severity level "error" and above to Sentry
    },
    datadog: {
        api_key: "your-datadog-api-key", // DataDog API key for log aggregation
        service_name: "your-service-name", // Service name for log identification in DataDog
    },
    winston: {
        // Any additional Winston configuration options can be provided here
    }
};

// Create the singleton logger instance with the specified configuration
Logger.create(loggerConfig);

// Log events with different severity levels
Logger.info("This is an information message.");
Logger.debug({ foo: "bar", baz: "qux" }); // Logging a JSON object
Logger.error(new Error("An error occurred."));
Logger.warn("This is a warning message.");

// Log events with custom severity level
Logger.log("custom", "This is a custom log message.");

```

### ABI Coder

The ABICoder class is a helper class for web3.js-related functionalities. It provides methods to encode and decode data based on the Ethereum contract Application Binary Interface (ABI). The class utilizes the web3-eth-abi library to perform the encoding and decoding operations. Developers can use this class to handle ABI-related tasks, such as encoding parameters for contract function calls, decoding function call outputs, and decoding logs emitted by smart contracts.

```typescript
// Import the ABICoder class
import { ABICoder } from "@maticnetwork/chain-indexer-framework/coder/abi-coder";

// Example function call encoding and decoding
const types = ["address", "uint256"];
const values = ["0x1234567890123456789012345678901234567890", "42"];

// Encode the parameters
const encodedParams = ABICoder.encodeParameters(types, values);
console.log("Encoded Parameters:", encodedParams);

// Decode the parameters
const decodedParams = ABICoder.decodeParameters(types, encodedParams);
console.log("Decoded Parameters:", decodedParams);

// Example log decoding
const eventInputs = [
    { type: "address", name: "from" },
    { type: "address", name: "to" },
    { type: "uint256", name: "amount" },
];

const logData = "0x1234567890123456789012345678901234567890";
const logTopics = ["0xabcdef1234567890", "0x0123456789abcdef"];

const decodedLog = ABICoder.decodeLog(eventInputs, logData, logTopics);
console.log("Decoded Log:", decodedLog);

// Example method call data decoding
const methodTypes = ["address", "uint256"];
const methodData = "0x0123456789abcdef"; // Assuming this is the data received from a method call

const decodedMethodData = ABICoder.decodeMethod(methodTypes, methodData);
console.log("Decoded Method Data:", decodedMethodData);

```

### Bloom Filter

The `BloomFilter` class is a wrapper around the `ethereum-bloom-filters` package, providing methods to check for the presence of contract addresses and topics in a Bloom filter. A Bloom filter is a probabilistic data structure used for efficient set membership tests. It allows fast and memory-efficient checks to determine whether an element is likely to be present in the set, with a certain probability of false positives.

```typescript
// Import the ABICoder class
import { BloomFilter } from "@maticnetwork/chain-indexer-framework/filter/bloom_Filter";

// Example Bloom filter and addresses/topics to check
const bloomFilter = "0x0123456789abcdef";
const contractAddress = "0x1234567890abcdef";
const topic = "0x7890abcdef1234567890abcdef";

// Check if the contract address is in the Bloom filter
const isAddressInBloom = BloomFilter.isContractAddressInBloom(bloomFilter, contractAddress);
console.log(`Is Contract Address in Bloom Filter? ${isAddressInBloom}`); // true or false

// Check if the topic is in the Bloom filter
const isTopicInBloom = BloomFilter.isTopicInBloom(bloomFilter, topic);
console.log(`Is Topic in Bloom Filter? ${isTopicInBloom}`); // true or false

```

## Conclusion 

This horizontal architectural approach allows to handle increasing workloads by adding more resources and not like vertical where you increase the resources of existing servers. It enables the system to maintain performance and handle larger amounts of data and traffic as the demands grow.Data in Kafka is organized into topics, and producers write data to specific topics. Consumers subscribe to topics and process the data in real-time. This decoupling of producers and consumers allows for a flexible and scalable architecture, as more producers and consumers can be added without affecting the existing ones.

Kafka is a distributed streaming platform that allows you to publish and subscribe to streams of records. It is designed to handle high-throughput, real-time data feeds and provides features such as fault tolerance, scalability, and message persistence, making it well-suited for handling blockchain data.

Here's how abstracting historic blockchain data through Kafka is providing reliability and performance benefits:

1. **Separating data producers and consumers**: By using Kafka, you can separate the blockchain data producers (e.g., blockchain nodes) from the consumers (e.g., applications specific data). This allows each component to work independently and reducing the risk of data loss or any delay.
2. **Reliable message delivery**: If a consumer fails in kafka, it can resume from where it got stopped once it recovers, avoiding any data loss. This is important when working with historical blockchain data that needs to be processed accurately.
3. **Multiple consumers and data replay**: Kafka allows same topics from the producer to be consumed by multiple consumers any number of times. this helps in preventing producing of blockchain data multiple times into the kafka stream. A consumer can even replay the processing of same topic if any change in required.

## Building

### Requirements

-   [Node.js](https://nodejs.org)
-   [npm](https://www.npmjs.com/)

### Install

Install all the dependencies:

```bash
npm install
```

### Building

Build the chain-indexer-framework package:

```bash
npm run build
```

### Testing (jest)

```bash
npm run tests
```

### Linking

using package locally

```bash
npm run build:link
```

## Support

Our [Discord](https://discord.gg/0xPolygonDevs) is the best way to reach us ✨.

## Contributing

You are very welcome to contribute, please see contributing guidelines - [[Contribute](./CONTRIBUTING.md)].

Thank you to all the people who already contributed to chain-indexer-framework!

<a href="https://github.com/maticnetwork/chain-indexer-framework/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=maticnetwork/chain-indexer-framework" />
</a>

Made with [contributors-img](https://contrib.rocks).

## License

[MIT](./LICENSE)
