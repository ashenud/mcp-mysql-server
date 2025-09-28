# Testing Guide for MySQL MCP Server

This guide helps you test the MySQL MCP Server with Cursor IDE before publishing.

## Prerequisites

1. **MySQL Database**: You need a running MySQL server for full testing
2. **Cursor IDE**: Latest version with MCP support
3. **Node.js**: Version 18+ installed

## Quick Test (No Database Required)

### 1. Test MCP Server Locally

```bash
cd /home/ashenud/git-repos/mcp-mysql-server
npm run build
npm test
```

Expected output:
- ✅ All tests should pass
- ✅ MCP Server is working correctly!

### 2. Test with Cursor IDE

1. **Add MCP Server to Cursor**:
   - Open Cursor IDE
   - Go to Settings → Features → MCP
   - Click "+ Add New MCP Server"
   - Use the configuration from `mcp.json`:

```json
{
  "mcpServers": {
    "mysql": {
      "command": "@ashenud/mcp-mysql-server",
      "args": [],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "your_username",
        "MYSQL_PASSWORD": "your_password",
        "MYSQL_DATABASE": "your_database"
      }
    }
  }
}
```

2. **Test Available Tools**:
   - In Cursor, you should see MySQL tools available
   - Try using `mysql_connect` or `mysql_setup_persistent`

## Full Test (With MySQL Database)

### 1. Set Up Test MySQL Database

```bash
# Install MySQL (if not already installed)
sudo apt update
sudo apt install mysql-server

# Start MySQL service
sudo systemctl start mysql
sudo systemctl enable mysql

# Create test database and user
sudo mysql -e "CREATE DATABASE testdb;"
sudo mysql -e "CREATE USER 'testuser'@'localhost' IDENTIFIED BY 'testpass';"
sudo mysql -e "GRANT ALL PRIVILEGES ON testdb.* TO 'testuser'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# Create test table
mysql -u testuser -ptestpass testdb -e "
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  age INT
);

INSERT INTO users (name, email, age) VALUES 
('John Doe', 'john@example.com', 30),
('Jane Smith', 'jane@example.com', 25),
('Bob Johnson', 'bob@example.com', 35);
"
```

### 2. Test with Real Database

1. **Connect to Database**:
   ```json
   {
     "name": "mysql_connect",
     "arguments": {
       "host": "localhost",
       "port": 3306,
       "user": "testuser",
       "password": "testpass",
       "database": "testdb"
     }
   }
   ```

2. **Test Query Execution**:
   ```json
   {
     "name": "mysql_query",
     "arguments": {
       "query": "SELECT * FROM users"
     }
   }
   ```

3. **Test List Tables**:
   ```json
   {
     "name": "mysql_list_tables",
     "arguments": {}
   }
   ```

4. **Test Describe Table**:
   ```json
   {
     "name": "mysql_describe_table",
     "arguments": {
       "table": "users"
     }
   }
   ```

5. **Test Prepared Statements**:
   ```json
   {
     "name": "mysql_query",
     "arguments": {
       "query": "SELECT * FROM users WHERE age > ?",
       "params": ["30"]
     }
   }
   ```

6. **Disconnect**:
   ```json
   {
     "name": "mysql_disconnect",
     "arguments": {}
   }
   ```

## Test Commands

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:protocol    # MCP protocol tests only
npm run test:all         # All tests
```

## Expected Results

### ✅ Successful Tests Should Show:

1. **mysql_connect**: Success message with connection details
2. **mysql_query**: JSON array with query results
3. **mysql_list_tables**: Array of table names
4. **mysql_describe_table**: Array with column information
5. **mysql_disconnect**: Success message

### ❌ Error Handling Tests:

1. **Invalid credentials**: Clear error message
2. **Invalid SQL**: SQL error details
3. **Missing connection**: "Not connected" error
4. **Invalid parameters**: Parameter validation errors

## Troubleshooting

### Common Issues:

1. **"MCP server not found"**:
   - Check the path in Cursor configuration
   - Ensure the server is built (`npm run build`)

2. **"Connection refused"**:
   - Check MySQL is running: `sudo systemctl status mysql`
   - Verify credentials and database name

3. **"Permission denied"**:
   - Check file permissions: `chmod +x dist/index.js`
   - Ensure Node.js can execute the file

4. **"Module not found"**:
   - Reinstall dependencies: `npm install`
   - Rebuild: `npm run build`

### Debug Mode:

Run the server with debug output:
```bash
DEBUG=* node dist/index.js
```

## Test Checklist

- [ ] MCP server starts without errors
- [ ] Tools list is returned correctly
- [ ] Connection to MySQL works
- [ ] Query execution works
- [ ] List databases works
- [ ] List tables works
- [ ] Describe table works
- [ ] Prepared statements work
- [ ] Disconnect works
- [ ] Error handling works
- [ ] Cursor IDE integration works
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All protocol tests pass

## Cleanup

After testing, clean up test data:
```bash
mysql -u testuser -ptestpass testdb -e "DROP TABLE users;"
sudo mysql -e "DROP USER 'testuser'@'localhost';"
sudo mysql -e "DROP DATABASE testdb;"
```

## Next Steps

Once all tests pass:
1. ✅ Package is ready for publishing
2. ✅ Run `npm publish --access public`
3. ✅ Test installation from npm
4. ✅ Update documentation if needed