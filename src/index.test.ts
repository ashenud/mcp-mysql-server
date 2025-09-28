import { MySQLMCPServer } from './index';

describe('MySQLMCPServer', () => {
  let server: MySQLMCPServer;

  beforeEach(() => {
    server = new MySQLMCPServer();
  });

  afterEach(() => {
    // Clean up any connections
  });

  test('should create server instance', () => {
    expect(server).toBeDefined();
  });

  // Add more tests as needed
});
