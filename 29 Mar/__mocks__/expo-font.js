module.exports = {
    loadAsync: jest.fn(() => Promise.resolve()),
    isLoaded: jest.fn(() => true),
    isLoading: jest.fn(() => false),
    unloadAsync: jest.fn(() => Promise.resolve()),
};
