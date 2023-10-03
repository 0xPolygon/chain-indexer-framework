const jestConfig = {
    transform: {
        "^.+\\.(j|t)s?$": "babel-jest"
    },
    extensionsToTreatAsEsm: ['.ts'],
    clearMocks: true
};

export default jestConfig;
