import { Mongoose, Schema, CompileModelOptions } from "mongoose";

let database: Database | null = null;

/**
 * Database class is a singleton class that provides simple straightforward method to connect and disconnect to database 
 * with a particular collection. it has one inconsistency on not extending this class from mongoose due to mongoose implementation.
 * that is why mongoose is initialized in the constructor.
 */
export class Database {
    private database!: Mongoose;

    /**
     * @param {string} url - The url for database that needs to be connected 
     * this constructor will create instance of database and initialize it with database URL
    */
    constructor(private url: string) {
        if (!database) {
            this.database = new Mongoose();
            database = this;
        }

        return database;
    }

    /**
     * The method connect will connect to database and will return if already connnected to db. It is an async function
     * to handle errors in better ways. It has a void return type. this function should only be called once when
     * the class is initialized. there is no harm in calling the function again as it will return if its already
     * connected to database
     * 
     * @returns {Promis<boolean>}
     */
    public async connect(): Promise<boolean> {
        if (!(this.database.connection.readyState === 1 || this.database.connection.readyState === 2)) {
            await this.database.connect(this.url);
        }

        return true;
    }

    /**
    * it will disconnect from database if database is connected. and has a void return type. It is internally
    * calling disconnect function of Mongoose. this function should only be called when database needs to be disconnected.
    * 
    * @returns {Promise<boolean>}
    */
    public async disconnect(): Promise<boolean> {
        if (!(this.database.connection.readyState === 0 || this.database.connection.readyState === 3)) {
            await this.database.disconnect();
        }

        return true;
    }

    /**
     * Defines a model or retrieves it.
     * Models defined on this mongoose instance are available to all connection created by the same mongoose instance.
     * 
     * @param {string} name - Name of the model. 
     * @param {Schema} schema - Schema for which model is to be created. 
     * @param {string} collection - Collection name of the model.
     * @param {CompileModelOptions} options - Optional object for mongoose options while creating the collection.
     * 
     * @returns {U} - The mongoose model.
     */
    public model<T, U, TQueryHelpers = {}>(
        name: string,
        schema?: Schema<T, any, any, TQueryHelpers, any, any>,
        collection?: string,
        options?: CompileModelOptions
    ): U {
        return this.database.model(name, schema, collection, options);
    }
}
