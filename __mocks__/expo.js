// Mock for Expo module to prevent Jest import errors
module.exports = {
  __ExpoImportMetaRegistry: {
    register: jest.fn(),
    get: jest.fn(() => ({})),
  },
};
