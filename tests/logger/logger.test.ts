import { Logger } from "../../dist/internal/logger/logger";
import winston, { Logger as WinstonLogger } from 'winston';
import SentryImport from "winston-transport-sentry-node";
//@ts-ignore
const Sentry = SentryImport.default;

//Have to do below as jest is not able to auto mock exports.default of common js correctly.
jest.mock('winston-transport-sentry-node', () => {
    return {
        default: jest.fn()
    }
});

//Manual mocking required as namespace conflicts with methods of same name.
jest.mock("winston", () => {
    return {
        format: {
            timestamp: jest.fn(),
            colorize: jest.fn(),
            printf: jest.fn(),
            combine: jest.fn()
        },
        transports: {
            Console: jest.fn().mockImplementation(() => {
                return {console: true};
            }),
            Http: jest.fn().mockImplementation(() => {
                return {datadog: true};
            })
        },
        createLogger: jest.fn()
    }
});

describe("Logger", () => {
    let mockedWinston: jest.Mocked<typeof winston>,
        mockedWinstonFormat: jest.MockedObject<typeof winston.format>,
        mockedWinstonTransports: jest.MockedObject<typeof winston.transports>,
        mockedSentryClass: jest.MockedClass<typeof Sentry>,
        mockedSentry: jest.MockedObject<typeof Sentry>;

    let mockedLogger: jest.MockedObject<WinstonLogger> = {
            info: jest.fn(),
            debug: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            log: jest.fn()
        } as jest.MockedObject<WinstonLogger>;

    beforeAll(()=>{
        Logger.create({ 
            winston: {
                level: "error"
            },
            sentry: {
                dsn: 'test_dsn', 
                level: 'error', 
                environment: 'staging'
            }, 
            datadog: {
                api_key: 'test_api_key', 
                service_name: 'test_app_key' 
            }
        });
    })

    beforeEach(() => {    
        mockedWinston = winston as jest.Mocked<typeof winston>;
        mockedWinstonFormat = winston.format as jest.MockedObject<typeof winston.format>;
        mockedWinstonTransports = winston.transports; 
        mockedSentryClass = Sentry as jest.MockedClass<typeof Sentry>;
    });

    test("create - should create logger with passed config or default config otherwise", () => {
        const colorizer = { addColors: (colors) => { } } as winston.Logform.Colorizer;

        mockedWinstonFormat.combine.mockReturnValueOnce({format: true} as unknown as winston.Logform.Format);
        
        mockedWinston.createLogger.mockReturnValueOnce(mockedLogger);

        mockedWinstonFormat.timestamp.mockReturnValueOnce(
            { options: {} } as winston.Logform.Format
        );
        mockedWinstonFormat.colorize.mockReturnValueOnce(colorizer);
        mockedWinstonFormat.printf.mockReturnValueOnce(
            {} as winston.Logform.Format
        );

        Logger.create({ 
            winston: {
                level: "error"
            },
            sentry: {
                dsn: 'test_dsn', 
                level: 'error', 
                environment: 'staging'
            }, 
            datadog: {
                api_key: 'test_api_key', 
                service_name: 'test_app_key' 
            }
        });

        mockedSentry = mockedSentryClass.mock.instances[0] as unknown as jest.MockedObject<typeof Sentry>;
    
        expect(mockedWinstonFormat.combine).toHaveBeenNthCalledWith(
            1,
            { options: {} },
            colorizer,
            {}
        );

        //Since this the first time that Logger create is called we verify the first creation of winston logger
        expect(mockedWinston.createLogger).toHaveBeenCalledTimes(1);

        expect(mockedWinston.createLogger).toHaveBeenCalledWith(
            {
                level: 'error',
                format: {format: true},
                transports: [
                    {console: true},
                    mockedSentry,
                    {datadog: true}
                ]
            }
        );

        expect(mockedWinstonFormat.timestamp).toHaveBeenNthCalledWith(
            1,
            {
                format: 'YYYY-MM-DD HH:mm:ss:ms'
            }
        );

        expect(mockedWinstonFormat.colorize).toHaveBeenNthCalledWith(
            1,
            {
                all: true,
                colors: {
                    error: 'red',
                    warn: 'yellow',
                    info: 'green',
                    debug: 'white',
                }
            }
        );

        expect(mockedWinstonFormat.printf).toHaveBeenCalledTimes(1);

        expect(Sentry).toHaveBeenNthCalledWith(
            1,
            {
                level: 'error',
                sentry: {
                    dsn: 'test_dsn', 
                    environment: 'staging'
                }
            }
        );

        expect(mockedWinstonTransports.Http).toHaveBeenNthCalledWith(
            1,
            {
                host: 'http-intake.logs.datadoghq.com',
                path: '/api/v2/logs?dd-api-key=test_api_key&ddsource=nodejs&service=test_app_key',
                ssl: true
            }
        );

        expect(mockedWinstonTransports.Console).toHaveBeenCalledTimes(1);
    });

    test('Logger is a singleton', () => {
        // Create an instance of Logger
        Logger.create({ 
            winston: {
                level: "error"
            },
            sentry: {
                dsn: 'test_dsn2', 
                level: 'error' , 
                environment: 'staging'
            }, 
            datadog: {
                api_key: 'test_api_key2', 
                service_name: 'test_app_key' 
            }
        });

        //Since the test "create - should create logger with passed config or default config otherwise" has already been executed before this test,
        //calling Logger create method will not call the createLogger of mockedWinston. Verifying this will serve as our test for Singleton.
        expect(mockedWinston.createLogger).toHaveBeenCalledTimes(0);
    });
    
    test("info must call logger.info with the message passed", () => {
        Logger.info("mock");

        expect(mockedLogger.info).toBeCalledWith("mock");
    });

    test("info must call logger.info with stringified message of the object", () => {
        Logger.info({ mock: "string" });

        expect(mockedLogger.info).toBeCalledWith(JSON.stringify({ mock: "string" }));
    });

    test("debug must call logger.debug with the message passed", () => {
        Logger.debug("mock");

        expect(mockedLogger.debug).toBeCalledWith("mock");
    });

    test("debug must call logger.debug with stringified message of the object", () => {
        Logger.debug({ mock: "string" });

        expect(mockedLogger.debug).toBeCalledWith(JSON.stringify({ mock: "string" }));
    });

    test("error must call logger.error with the message passed", () => {
        Logger.error("mock");

        expect(mockedLogger.error).toBeCalledWith("mock");
    });

    test("error must call logger.error with stringified message of the object", () => {
        Logger.error(new Error("mock"));

        expect(mockedLogger.error).toBeCalledWith(`${new Error("mock").message} : ${JSON.stringify(new Error("mock"))}`);
    });

    test("warn must call logger.warn with the message passed", () => {
        Logger.warn("mock");

        expect(mockedLogger.warn).toBeCalledWith("mock");
    });

    test("warn must call logger.warn with stringified message of the object", () => {
        Logger.warn({ mock: "string" });

        expect(mockedLogger.warn).toBeCalledWith(JSON.stringify({ mock: "string" }));
    });

    test("log must call logger.log with the message passed", () => {
        Logger.log("error", "mock");

        expect(mockedLogger.log).toBeCalledWith("error", "mock");
    });

    test("log must call logger.log with stringified message of the object", () => {
        Logger.log("error", { mock: "string" });

        expect(mockedLogger.log).toBeCalledWith("error", JSON.stringify({ mock: "string" }));
    });
});
