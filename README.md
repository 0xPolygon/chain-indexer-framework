# Chainflow - Blockchain Data Indexer

ChainFlow, is a powerful framework designed to facilitate the development of flexible event-driven data pipelines on EVM blockchains. Built on the reliable foundation of Kafka, ChainFlow empowers developers to build robust and scalable applications that seamlessly process blockchain events and enable real-time data integration.

In today's rapidly evolving blockchain ecosystem, the need for efficient and reliable data processing is paramount. EVM (Ethereum Virtual Machine) blockchains, such as Ethereum itself and its compatible networks, have gained significant traction due to their smart contract capabilities and decentralized nature. However, working with blockchain data at scale and in real time presents unique challenges.

ChainFlow addresses these challenges by providing a comprehensive set of Node.js packages that simplify the development of event-driven data pipelines. With its intuitive design and seamless integration with Kafka, one of the most popular and battle-tested distributed streaming platforms, ChainFlow offers a robust and reliable infrastructure for processing blockchain events efficiently.

## Key Features

- **Event-driven Architecture:** ChainFlow embraces the power of event-driven architecture, allowing developers to create pipelines that react to blockchain events in real time. By leveraging this approach, applications built with ChainFlow can easily respond to changes on the blockchain, enabling near-instantaneous data processing.
- **Flexible Data Pipelines:** ChainFlow offers a flexible and extensible framework for building data pipelines that suit your specific needs. Developers can easily define their desired data flow, including event filtering, transformation, and aggregation, by utilizing the rich set of ChainFlow's features and packages.
- **Seamless Integration with Kafka:** As the backbone of ChainFlow, Kafka provides the necessary infrastructure for handling high-throughput, fault-tolerant, and scalable data streams. ChainFlow's integration with Kafka ensures reliable data processing and enables seamless interoperability with other Kafka-based systems, further enhancing the versatility of your data pipelines.
- **EVM Blockchain Compatibility:** ChainFlow is specifically designed for EVM blockchains, enabling developers to harness the power of smart contracts and decentralized applications. Whether you are working with Ethereum or any other EVM-compatible blockchain, ChainFlow provides a unified and consistent approach to processing blockchain events across different networks. ChainFlow packages can also be used for other chains with custom implementations.
- **Extensive Package Ecosystem:** ChainFlow offers a rich ecosystem of Node.js packages that cater to various aspects of building event-driven data pipelines. From connecting to blockchain networks, managing Kafka topics, to implementing data processing logic, the ChainFlow package ecosystem provides a comprehensive toolkit to expedite your development process.

With ChainFlow, you can unlock the true potential of EVM blockchains by seamlessly integrating them into your data infrastructure. Whether you are building real-time analytics, decentralized applications, or any other data-driven solution, this documentation will guide you through the intricacies of using ChainFlow's packages and assist you in developing robust and efficient event-driven data pipelines on EVM blockchains.

## Installation

You can install the package using [NPM](https://www.npmjs.com/package/web3)

```bash
npm install @maticnetwork/chainflow
```

## Usage

```js
// In Node.js
const chainflow = require('@maticnetwork/chainflow');
```

You will learm more about usage as we go through the doc below.

## Architecture

ChainFlow's architecture is composed of three main layers: block producers, transformers, and consumers. Each layer plays a crucial role in processing and transforming blockchain events to facilitate various use cases.

1. **Block Producers:**
Block producers are responsible for publishing raw block data to Kafka topics. This raw block data serves as the primary source of events for all use cases within ChainFlow. The block producers handle important tasks such as handling blockchain reorganizations (re-orgs) and backfilling of blocks. This ensures that developers only need to focus on specifying the desired RPC (Remote Procedure Call) endpoints they want to provide, without worrying about the intricacies of block management.

By leveraging the block producers, developers can easily connect to blockchain networks, retrieve the latest blocks, and publish them to Kafka topics, establishing a reliable and continuous stream of blockchain events.

2. **Transformers:**
The transformers layer plays a critical role in transforming the raw block data into domain-specific events. These transformers take the raw block data from the Kafka topics and apply various transformations to create meaningful and specialized events. The transformations can encompass a wide range of operations such as data enrichment, filtering, aggregation, or any other processing logic required for a specific use case.

The transformed domain-specific events are then published to their respective Kafka topics, enabling easy replay of events whenever required. This layer allows for flexibility and customization, ensuring that the events generated align with the specific needs of the applications and services built on top of ChainFlow.

3. **Consumers:**
Consumers are responsible for responding to the events published by the transformers layer. They are designed to receive and process the domain-specific events, triggering actions based on the requirements of the specific service or application. The consumers can be tailored to perform various tasks such as building API endpoints, indexing data to data warehouses for analytics, or notifying events to frontend applications.

By leveraging the events generated by the transformers, consumers can react in real time to changes on the blockchain, enabling seamless integration with other services and systems. This layer empowers developers to build powerful and dynamic applications that respond to blockchain events efficiently.

Together, these three layers form the foundation of ChainFlow, providing a comprehensive framework for building flexible and scalable event-driven data pipelines on EVM blockchains. Whether it's building real-time analytics, decentralized applications, or any other data-driven solution, ChainFlow's architecture offers the necessary tools and abstractions to streamline the development process and unlock the full potential of EVM blockchains.

## Kafka Wrappers

Kafka is a powerful stream processing platform that enables users to efficiently publish data into a queue and consume it as well. The underlying storage mechanism remains consistent, while differentiation between various queues is achieved through the use of Kafka topics. The purpose of implementing wrapper classes in this architecture is to streamline the process of publishing and consuming events from Kafka topics, making it easier and more intuitive for users.

Please note that both the Producer classes and Consumer classes utilize internal Coder classes for message serialization/deserialization. For further details on the Coder, kindly refer to the additional information provided under the Coder section below.

1. **Synchronous and Asynchronous** Producer classes play crucial roles in publishing events or data to Kafka topics. The choice between these two classes depends on specific requirements and trade-offs.
    
    The Synchronous Producer class is recommended when the utmost importance is placed on data integrity and the tolerance for potential delays is higher than the risk of data loss. This class ensures that even if the service encounters downtime or disruptions, it will resume publishing from the exact point it left off. By maintaining a synchronous nature, it guarantees the completion of each message before moving on to the next, prioritizing data integrity and consistency.

    ```typescript
    import { SynchronousProducer } from "@maticnetwork/chainflow/kafka/producer/synchronous_producer";
    // learn more about coder in additional topics below
    import { Coder } from "@maticnetwork/chainflow/coder/protobuf_coder";

    const producer = new SynchronousProducer(
        new Coder(
            "matic_transfer", // fileName
            "matictransferpackage", // packageName
            "MaticTransferBlock", // messageType
        ),
        {
            "topic": "<PRODUCER_TOPIC>",
            "bootstrap.servers": "<KAFKA_CONNECTION_URL>",
            "security.protocol": "plaintext",
            "message.max.bytes": 26214400
        }
    )

    producer.start();
    producer.produceEvent("<key: string>", "<message: object>");

    // or use functional implementation

    import { produce } from "@maticnetwork/chainflow/kafka/producer/produce";
    import { Coder } from "@maticnetwork/chainflow/coder/protobuf_coder";

    const producer = produce(
        {
            "topic": "<PRODUCER_TOPIC>",
            "bootstrap.servers": "<KAFKA_CONNECTION_URL>",
            "security.protocol": "plaintext",
            "message.max.bytes": 26214400,
            "coderConfig": {
                fileName: "matic_transfer",
                packageName: "matictransferpackage",
                messageType: "MaticTransferBlock",
            },
            type: "synchronous" // use 'synchronous'. if synchronous producer is needed
        }
    )

    producer.produceEvent("<key: string>", "<message: object>");

    ```

    On the other hand, the Asynchronous Producer class is designed for scenarios where maximizing throughput and minimizing latency are paramount. This class prioritizes speed and efficiency by allowing rapid publication of data. However, it should be noted that using the asynchronous approach carries a higher risk of data loss. If the service experiences an interruption, the previous batch will be considered published, even if it wasn't fully transmitted.

    ```typescript
    import { AsynchronousProducer } from "@maticnetwork/chainflow/kafka/producer/asynchronous_producer";
    import { Coder } from "@maticnetwork/chainflow/coder/protobuf_coder";

    const producer = new AsynchronousProducer(
        new Coder(
            "matic_transfer", // fileName
            "matictransferpackage", // packageName
            "MaticTransferBlock", // messageType
        ),
        {
            "topic": "<PRODUCER_TOPIC>",
            "bootstrap.servers": "<KAFKA_CONNECTION_URL>",
            "security.protocol": "plaintext",
            "message.max.bytes": 26214400
        }
    )

    producer.start();
    producer.produceEvent("<key: string>", "<message: object>");
    ```

2. **Synchronous and Asynchronous** Consumer classes play vital roles in the consumption of events or data from Kafka topics. Similar to their producer counterparts, the choice between these classes depends on specific requirements and priorities.
    
    The Synchronous Consumer class is the preferred option when ensuring data integrity and avoiding any loss is of paramount importance, even if it means sacrificing speed. With this class, each event is consumed in a synchronous manner, guaranteeing that no data is missed or left unprocessed. By prioritizing reliability, it provides a slower but more dependable consumption process.

    ```typescript
    import { SynchronousConsumer } from "@maticnetwork/chainflow/kafka/consumer/synchronous_consumer";
    import { Coder } from "@maticnetwork/chainflow/coder/protobuf_coder";

    const consumer = new SynchronousConsumer(
        '<CONSUMER_TOPIC>',
        {
            ['<CONSUMER_TOPIC>']: new Coder(
                "block", // fileName
                "blockpackage", // packageName
                "Block", // messageType
            )
        },
        {
            "bootstrap.servers": '<KAFKA_CONNECTION_URL>'
            "group.id": '<GROUP_ID>'
            "security.protocol": "plaintext",
            "message.max.bytes": 26214400,
            "fetch.message.max.bytes": 26214400
        }
    ),

    consumer.start({
        next: () => {},
        error: () => {},
        closed: () => {}
    });

    // or you can use the functional implementation

    import { consume } from "@maticnetwork/chainflow/kafka/consumer/consume";
    import { Coder } from "@maticnetwork/chainflow/coder/protobuf_coder";

    consume({
        "metadata.broker.list": '<KAFKA_CONNECTION_URL>'
        "group.id": '<GROUP_ID>'
        "security.protocol": "plaintext",
        "topic": '<CONSUMER_TOPIC>'
        "coderConfig": {
            fileName: "block",
            packageName: "blockpackage",
            messageType: "Block",
        },
        type: 'synchronous'
    }, {
        next: () => {},
        error: () => {},
        closed: () => {}
    });
    ```

    On the other hand, the Asynchronous Consumer class is designed for scenarios where the speed of data consumption takes precedence over potential data loss. If the timely processing of events is critical and the occasional loss of some events is acceptable within defined limits, the asynchronous approach offers enhanced performance. By consuming events in a non-blocking manner, it allows for faster processing and higher throughput, albeit with a higher risk of occasional data loss.

    ```js
    import { AsynchronousConsumer } from "@maticnetwork/chainflow/kafka/consumer/asynchronous_consumer";
    import { Coder } from "@maticnetwork/chainflow/coder/protobuf_coder";

    const consumer = new AsynchronousConsumer(
        '<CONSUMER_TOPIC>',
        {
            ['<CONSUMER_TOPIC>']: new Coder(
                "block", // fileName
                "blockpackage", // packageName
                "Block", // messageType
            )
        },
        {
            "bootstrap.servers": '<KAFKA_CONNECTION_URL>'
            "group.id": '<GROUP_ID>'
            "security.protocol": "plaintext",
            "message.max.bytes": 26214400,
            "fetch.message.max.bytes": 26214400
        }
    ),

    consumer.start({
        next: () => {},
        error: () => {},
        closed: () => {}
    });
    ```

## Block Producers

Block producers play a critical role in the seamless publishing of raw block data to Kafka topics. It is essential to recognize that each blockchain network has its own unique implementation, and the functionality of Remote Procedure Calls (RPCs) can differ across these networks. In the current implementation, all block producers leverage the SynchronousProducerClass from the Kafka wrapper classes.

ChainFlow block producers encompass three distinct types of producers, each designed to cater to the specific requirements of different blockchain networks.

1. **BlockPollingProducer**: This producer employs a polling method to continuously check the blockchain for new blocks. If the blockchain is already in sync, it waits for the completion of a predefined timeout before initiating the polling process again. This method is straightforward and involves utilizing basic RPC calls commonly found in every node. Additionally, it serves as an ideal choice when the web socket (wss) node is unavailable for a particular blockchain network.

    ```typescript
    import { BlockPollerProducer } from "@maticnetwork/chainflow/block_producers/block_polling_producer";

    BlockPollerProducer.new(
        {
            startBlock: '<START_BLOCK as number>',
            rpcWsEndpoints: ['<HTTP_PROVIDER_1>', '<HTTP_PROVIDER_2>'],
            blockPollingTimeout: '<BLOCK_POLLING_TIMEOUT as string>',
            topic: '<PRODUCER_TOPIC>',
            maxReOrgDepth: '<MAX_REORG_DEPTH>',
            maxRetries: '<MAX_RETRIES>',
            mongoUrl: '<MONGO_DB_URL>',
            "bootstrap.servers": '<KAFKA_CONNECTION_URL>',
            "security.protocol": "plaintext"
        }
    ).then(producer => {
        producer.on("blockProducer.fatalError", (error) => {
            console.error(`Block producer exited. ${error.message}`);

            process.exit(1); // Exiting process on fatal error. Process manager needs to restart the process.
        });
        
        producer.start().catch((error) => {
            console.error(error);
        });
    });

    // or you can use the functional implementation

    import { getProducer } from "@maticnetwork/chainflow/block_producers/produce_blocks";

    const producer = produceBlocks({
        startBlock: '<START_BLOCK as number>',
        rpcWsEndpoints: ['<HTTP_PROVIDER_1>', '<HTTP_PROVIDER_2>'],
        blockPollingTimeout: '<BLOCK_POLLING_TIMEOUT as string>',
        topic: '<PRODUCER_TOPIC>',
        maxReOrgDepth: '<MAX_REORG_DEPTH>',
        maxRetries: '<MAX_RETRIES>',
        mongoUrl: '<MONGO_DB_URL>',
        "bootstrap.servers": '<KAFKA_CONNECTION_URL>',
        "security.protocol": "plaintext"
        blockSubscriptionTimeout: 120000,
    })

    producer.on("blockProducer.fatalError", (error: any) => {
        Logger.error(`Block producer exited. ${error.message}`);

        process.exit(1); // Exiting process on fatal error. Process manager needs to restart the process.
    }); 
    ```

2. **ErigonBlockProducer**: This particular block producer operates by subscribing to blocks through a web socket providers and utilizes an erigon node to produce data for Kafka. What sets the erigon node apart from other nodes is its unique characteristic of not requiring separate calls for obtaining receipts for each transaction. Instead, it efficiently retrieves block details with just two calls: one to retrieve the overall block information and another to fetch all the transaction details within that block. While the former call is commonly used across various nodes, the latter, that used the `eth_getBlockReceipts` method, distinguishes the erigon node from others in the network.

    ```typescript
    import { ErigonBlockProducer } from "@maticnetwork/chainflow/block_producers/erigon_block_producer";

    ErigonBlockProducer.new(
        {
            startBlock: '<START_BLOCK as number>',
            rpcWsEndpoints: ['<RPC_WS_ENDPOINT_URL_LIST_1>', '<RPC_WS_ENDPOINT_URL_LIST_2>'],
            blockPollingTimeout: '<BLOCK_POLLING_TIMEOUT as string>',
            topic: '<PRODUCER_TOPIC>',
            maxReOrgDepth: '<MAX_REORG_DEPTH>',
            maxRetries: '<MAX_RETRIES>',
            mongoUrl: '<MONGO_DB_URL>',
            "bootstrap.servers": '<KAFKA_CONNECTION_URL>',
            "security.protocol": "plaintext"
        }
    ).then(producer => {
        producer.on("blockProducer.fatalError", (error) => {
            console.error(`Block producer exited. ${error.message}`);

            process.exit(1); // Exiting process on fatal error. Process manager needs to restart the process.
        });
        
        producer.start().catch((error) => {
            console.error(error);
        });
    });

    // or you can use the functional implementation

    import { getProducer } from "@maticnetwork/chainflow/block_producers/produce_blocks";

    const producer = produceBlocks({
        startBlock: '<START_BLOCK as number>',
        rpcWsEndpoints: ['<HTTP_PROVIDER_1>', '<HTTP_PROVIDER_2>'],
        blockPollingTimeout: '<BLOCK_POLLING_TIMEOUT as string>',
        topic: '<PRODUCER_TOPIC>',
        maxReOrgDepth: '<MAX_REORG_DEPTH>',
        maxRetries: '<MAX_RETRIES>',
        mongoUrl: '<MONGO_DB_URL>',
        "bootstrap.servers": '<KAFKA_CONNECTION_URL>',
        "security.protocol": "plaintext"
        blockSubscriptionTimeout: 120000,
        type: 'erigon' // required if erigon block producer is needed
    })

    producer.on("blockProducer.fatalError", (error: any) => {
        Logger.error(`Block producer exited. ${error.message}`);

        process.exit(1); // Exiting process on fatal error. Process manager needs to restart the process.
    }); 
    ```

3. **QuickNodeBlockProducer**: The highly optimized block producer exclusively runs on QuickNode RPCs, utilizing the same web socket provider. However, what sets it apart is that QuickNode exposes the `qn_getBlockWithReceipts` method, which streamlines the process of retrieving both block details and transaction information within a single call. Unlike the ErigonBlockProducer, which necessitates two separate calls, or the BlockPollingProducer, which requires multiple calls, this method significantly simplifies the data retrieval process. To utilize this producer effectively, it is essential for QuickNode to support the `qn_getBlockWithReceipts` method for the desired chain.

    ```typescript
    import { QuickNodeBlockProducer } from "@maticnetwork/chainflow/block_producers/quicknode_block_producer";

    QuickNodeBlockProducer.new(
        {
            startBlock: '<START_BLOCK as number>',
            rpcWsEndpoints: ['<RPC_WS_ENDPOINT_URL_LIST_1>', '<RPC_WS_ENDPOINT_URL_LIST_2>'],
            blockPollingTimeout: '<BLOCK_POLLING_TIMEOUT as string>',
            topic: '<PRODUCER_TOPIC>',
            maxReOrgDepth: '<MAX_REORG_DEPTH>',
            maxRetries: '<MAX_RETRIES>',
            mongoUrl: '<MONGO_DB_URL>',
            "bootstrap.servers": '<KAFKA_CONNECTION_URL>',
            "security.protocol": "plaintext"
        }
    ).then(producer => {
        producer.on("blockProducer.fatalError", (error) => {
            console.error(`Block producer exited. ${error.message}`);

            process.exit(1); // Exiting process on fatal error. Process manager needs to restart the process.
        });
        
        producer.start().catch((error) => {
            console.error(error);
        });
    });

    // or you can use the functional implementation

    import { getProducer } from "@maticnetwork/chainflow/block_producers/produce_blocks";

    const producer = produceBlocks({
        startBlock: '<START_BLOCK as number>',
        rpcWsEndpoints: ['<HTTP_PROVIDER_1>', '<HTTP_PROVIDER_2>'],
        blockPollingTimeout: '<BLOCK_POLLING_TIMEOUT as string>',
        topic: '<PRODUCER_TOPIC>',
        maxReOrgDepth: '<MAX_REORG_DEPTH>',
        maxRetries: '<MAX_RETRIES>',
        mongoUrl: '<MONGO_DB_URL>',
        "bootstrap.servers": '<KAFKA_CONNECTION_URL>',
        "security.protocol": "plaintext"
        blockSubscriptionTimeout: 120000,
        type: 'quicknode' // required if quicknode block producer is needed
    })

    producer.on("blockProducer.fatalError", (error: any) => {
        Logger.error(`Block producer exited. ${error.message}`);

        process.exit(1); // Exiting process on fatal error. Process manager needs to restart the process.
    }); 
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
import { SynchronousDataTransformer } from "@maticnetwork/chainflow/data_transformation/synchronous_data_transformer";
import { SynchronousConsumer } from "@maticnetwork/chainflow/kafka/consumer/synchronous_consumer";
import { AsynchronousProducer } from "@maticnetwork/chainflow/kafka/producer/asynchronous_producer";
import { ITransformedBlock } from "@maticnetwork/chainflow/interfaces/transformed_block";


// <T> is the consuming data type interface
// <Y> is the producer data type interface
export class TransformerClass extends SynchronousDataTransformer<T, Y> {
	constructor(
		consumer: SynchronousConsumer,
        producer: AsynchronousProducer
	) {
		super(consumer, producer);
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
            // and even based on the domain event that is trasnformed
            const getFormattedTransaction = tranform_X_to_Y_Function(transaction);
            transformedData = transformedData.concat(getFormattedTransaction);
        });

        return transformedData;
  }
}

let transformer = new TransformerClass('<CONSUMER>','<PRODUCER>');
transformer.start();
```

## Consumers

The final layer of the architecture possesses both simplicity and intelligence. It can be considered "dumb" in the sense that it directly consumes Kafka topics generated by the transformers and saves them into the database without any modification. On the other hand, it demonstrates its intelligence by managing reorganization processes. This layer monitors the event stream for blocks, and if a block appears again, it recognizes it as a reorganization event and updates the database accordingly. Additionally, this layer exposes an endpoint that can be accessed by clients. When called, the endpoint queries the database to retrieve the required data and sends it back to the client. It is worth mentioning that this layer has the capability to consume multiple Kafka topics from the transformer layer and update the database accordingly. To facilitate event consumption, it employs a consumer wrapper class from Kafka.

```typescript
import { SynchronousConsumer } from "@maticnetwork/chainflow/kafka/consumer/synchronous_consumer";
import { DeserialisedMessage } from "@maticnetwork/chainflow/interfaces/deserialised_kafka_message";
import { ITransformedBlock } from "@maticnetwork/chainflow/interfaces/transformed_block";

export class ConsumerClass {
	constructor(
		consumer1: SynchronousConsumer,
        consumer2: SynchronousConsumer,
		serviceClass: '<CUSTOM_SERVICE_CLASS>'
	) {}

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
        const transformedBlock = message.value as ITransformedBlock<TYPE>;
        if (transformedBlock.data && transformedBlock.data.length > 0) {
            // this service class is used to add data to DB and also exposes
            // function to call the DB for api calls. 
            await this.serviceClass.save(transformedBlock);
        }
    }
}

let consumer = new ConsumerClass('<CONSUMER_1>', '<CONSUMER_2>', '<SERVICE>');
transformer.execute();

// or you can use the functional implementation

import { ITransformedBlock } from "@maticnetwork/chainflow/interfaces/transformed_block";
import { DeserialisedMessage } from "@maticnetwork/chainflow/interfaces/deserialised_kafka_message";
import { consume } from "@maticnetwork/chainflow/kafka/consumer/consume";
import transferService from "path_to_service_file";

consume({...consumerConfig}, {
    next: async (message: DeserialisedMessage) => {
        const transformedBlock = message.value as ITransformedBlock<TYPE>;

        if (transformedBlock.data && transformedBlock.data.length > 0) {
            await transferService.save(transformedBlock);
        }
    },
    error(err: Error) {
        console.error('something wrong occurred: ' + err);
    },
    closed: () => {
        Logger.info(`subscription is ended.`);
        throw new Error("Consumer stopped");
    },
});

```

## Examples
To gain a clearer understanding of the entire process, let's consider a straightforward example that involves indexing MATIC transfer events from the Ethereum blockchain. This [example](./example/README.md) encompasses all the layers involved, starting from producers, moving through transformers, and concluding with consumers.

## Conclusion 

This horizontal architectural approach allows to handle increasing workloads by adding more resources and not like vertical where you increase the resources of existing servers. It enables the system to maintain performance and handle larger amounts of data and traffic as the demands grow.Data in Kafka is organized into topics, and producers write data to specific topics. Consumers subscribe to topics and process the data in real-time. This decoupling of producers and consumers allows for a flexible and scalable architecture, as more producers and consumers can be added without affecting the existing ones.

Kafka is a distributed streaming platform that allows you to publish and subscribe to streams of records. It is designed to handle high-throughput, real-time data feeds and provides features such as fault tolerance, scalability, and message persistence, making it well-suited for handling blockchain data.

Here's how abstracting historic blockchain data through Kafka is providing reliability and performance benefits:

1. **Separating data producers and consumers**: By using Kafka, you can separate the blockchain data producers (e.g., blockchain nodes) from the consumers (e.g., applications specific data). This allows each component to work independently and reducing the risk of data loss or any delay.
2. **Reliable message delivery**: If a consumer fails in kafka, it can resume from where it got stopped once it recovers, avoiding any data loss. This is important when working with historical blockchain data that needs to be processed accurately.
3. **Multiple consumers and data replay**: Kafka allows same topics from the producer to be consumed by multiple consumers any number of times. this helps in preventing producing of blockchain data multiple times into the kafka stream. A consumer can even replay the processing of same topic if any change in required.

## Additional Information

### Coder

Kafka operates exclusively on bytes and does not handle the internal process of message serialization or deserialization. Therefore, it is essential to serialize messages before publishing them to Kafka and to deserialize them when consuming. This is where the Coder class comes into play. Acting as a wrapper, the Coder class provides a general approach to message serialization and deserialization. Currently, it supports protobuf serialization and deserialization, with the potential for extending to other formats in the future by creating additional wrapper classes. This eliminates the need for each user to implement their own serialization and deserialization functions. By defining the message structure in a `.proto` file, you can efficiently utilize it for data serialization and deserialization, streamlining the overall process.

```typescript
import { Coder } from "@maticnetwork/chainflow/coder/protobuf_coder";

const coderFucntion = async() => {
	const coderInstance = new Coder(
	    '<fileName>', // The file for finding the protobuf type.  
	    '<packageName>', // The default package where the protobuf type is defined. 
	    '<messageType>' // The default protobuf message type to be used for deserialising.
        '<fileDirectory>' // directory where all schemas are there. this field is optional if .proto type that is required is already present in chainflow package.
	)
	
	let buffer = await coderInstance.serialize('<messageObject>');
	let message = await coderInstance.deserialize(buffer);
}
```

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

Build the chainflow package:

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

## Contributing

Please follow the [Contribution Guidelines](./CONTRIBUTIONS.md) on contributing to the chainflow.

## License

[UNLICENSED](./LICENSE)