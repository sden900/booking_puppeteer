module.exports = {
    
    use_proxy: process.env.USE_PROXY?.toLowerCase() === 'true' || false, // Whether to use a proxy server. Set to true to enable proxy usage. 
    browser_connect: process.env.BROWSER_CONNECT?.toLowerCase() === 'true' || true, // Whether to connect to an existing browser instance. Set to true to enable browser connection. Set to false to launch a new headless browser instance.
    browser_url: process.env.BROWSER_URL || 'http://127.0.0.1:9222', // The URL of the existing browser instance to connect to. 
    
    //database connection settings
    //db should have a 'proxies' table with columns: ip, port, username, password
    db_host: process.env.DB_HOST, 
    db_port: process.env.DB_PORT, 
    db_name: process.env.DB_NAME, 
    db_user: process.env.DB_USER, 
    db_password: process.env.DB_PASSWORD, 
};