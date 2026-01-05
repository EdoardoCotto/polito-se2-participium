module.exports = function TelegramBot() {
  return {
    setMyCommands: () => Promise.resolve(true),
    onText: () => {},
    on: () => {},
    sendMessage: () => Promise.resolve({ message_id: 1 }),
    processUpdate: () => {},
    getMe: () => Promise.resolve({ id: 123, username: 'mock_bot' }),
    setWebHook: () => Promise.resolve(true),
    getFile: () => Promise.resolve({ file_path: 'mock/file.jpg' }),
    token: 'mock-token'
  };
};
