module.exports = {
    preset: 'jest-expo',
    setupFiles: ['<rootDir>/jest.setup.js'],
    setupFilesAfterEnv: [
        '@testing-library/jest-native/extend-expect'
    ],
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
    },
    transformIgnorePatterns: [
        'node_modules/(?!(react-native' +
        '|expo' +
        '|expo-device' +
        '|expo-font' +
        '|expo-asset' +
        '|expo-constants' +
        '|expo-status-bar' +
        '|expo-linear-gradient' +
        '|expo-modules-core' +
        '|expo-file-system' +
        '|@expo' +
        '|@react-native' +
        '|@react-native-community' +
        '|@react-navigation' +
        '|react-native-reanimated' +
        '|jest-expo)/)'
    ],
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js'
    },
    testMatch: ['<rootDir>/tests/**/*.[jt]s?(x)']
};
