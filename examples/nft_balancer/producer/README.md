# Producer
The Producer package exemplifies the producer layer of Chain Indexer Framework. It fetches blockchain data from Polygon zkEVM testnet chain and produces it to a Kafka topic.

## How to Use
Note: Make sure you are inside the example/nft_balancer/producer folder.

### 1. Set Configuration
Begin by configuring your environment variables. Copy the `.env.example` file and rename it to `.env`. Then, provide appropriate values for the keys mentioned in the `.env` file.

### 2. Install Packages
Install the required packages by running the following command:

```
npm i
```

### 3. Build the Package
Build the package by executing the following command:

```
npm run build
```

### 4. Run the Package
Run the producer service using the following command:

```
npm run start
```

## Running the Example Using Source Code

This section guides you on running the example code using the current source code, typically for debugging purposes.

### 1. Build & Link the Source Code
Run the following command at the root of this project:

```
npm run build:link
```

If you encounter permission issues, run the command using `sudo`.


### 2. Link the Library

- Navigate to the examples/nft_balancer/producer folder:

    ```
    cd examples/nft_balancer/producer
    ```

- Execute the link command:

    ```
    npm run link:lib
    ```
    
This documentation clarifies the setup and usage of the Producer package in the Chain Indexer Framework project, making it easier for developers to integrate the package into their applications or utilize it for debugging and testing purposes.
