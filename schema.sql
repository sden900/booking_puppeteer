CREATE DATABASE proxies;

USE proxies;

CREATE TABLE proxies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    proxy VARCHAR(100) NOT NULL,    /* The proxy address in the format "ip:port" */
    username VARCHAR(50),           /* Optional username for proxy authentication */
    password VARCHAR(50),           /* Optional password for proxy authentication */
    last_used TIMESTAMP,            /* Timestamp of the last time the proxy was used */
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);  