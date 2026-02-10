module.exports = {

    use_proxy: process.env.use_proxy === 'true' || false, // Whether to use a proxy server. Set to true to enable proxy usage. 
    browser_connect: process.env.browser_connect === 'true' || true, // Whether to connect to an existing browser instance. Set to true to enable browser connection. Set to false to launch a new headless browser instance.
    browser_url: process.env.browser_url || 'http://172.21.208.1:9223', // The URL of the existing browser instance to connect to. 
    
    //database connection settings
    //db should have a 'proxies' table with columns: ip, port, username, password
    db_host: process.env.db_host || 'localhost', 
    db_port: process.env.db_port || 3306, 
    db_name: process.env.db_name || 'proxies', 
    db_user: process.env.db_user || 'example_user', 
    db_password: process.env.db_password || 'example_password', 
};