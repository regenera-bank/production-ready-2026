jest.mock('@google-cloud/vertexai', () => {
  return {
    VertexAI: jest.fn().mockImplementation(() => {
      return {};
    }),
  };
});

jest.mock('@google-cloud/text-to-speech', () => {
  return {
    TextToSpeechClient: jest.fn().mockImplementation(() => {
      return {
        synthesizeSpeech: jest
          .fn()
          .mockResolvedValue([{ audioContent: 'mock_audio' }]),
      };
    }),
  };
});
