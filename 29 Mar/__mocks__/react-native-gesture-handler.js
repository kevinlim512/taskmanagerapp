module.exports = {
    GestureHandlerRootView: ({ children }) => children,
    Swipeable: jest.fn().mockImplementation(({ children }) => children),
    FlatList: jest.requireActual('react-native').FlatList,
    PanGestureHandler: jest.fn(),
    State: {},
    TapGestureHandler: jest.fn(),
    TextInput: jest.requireActual('react-native').TextInput,
    ScrollView: jest.requireActual('react-native').ScrollView,
    TouchableOpacity: jest.requireActual('react-native').TouchableOpacity,
    View: jest.requireActual('react-native').View,
  };
  