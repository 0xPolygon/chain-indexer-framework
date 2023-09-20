import type { JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
    "transform": {
        "^.+\\.(j|t)s?$": "babel-jest"
    },
    extensionsToTreatAsEsm: ['.ts'], 
    clearMocks: true
}

export default jestConfig

