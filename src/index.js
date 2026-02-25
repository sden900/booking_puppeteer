const puppeteer = require('puppeteer');
const UserAgent = require('user-agents');
const proxyChain = require('proxy-chain');
const targetUrl = "https://www.booking.com/searchresults.html?ss=Stockholm%2C+Sweden&efdco=1&lang=en-us&checkin=2026-02-18&checkout=2026-02-28&group_adults=2&no_rooms=1&group_children=0";

require('dotenv').config(); // Load environment variables from .env file
const config = require('../config'); // Load configuration settings from config.js


// global variables for browser, page and browser context. These are initialized in the initBrowser function and used throughout the script. 
var browser, page, browserContext;

(async () => {

    await initBrowser();

    await page.goto(targetUrl, { timeout: 10000, waitUntil: "networkidle2", referer: targetUrl, referrerPolicy: 'origin' });
    await closePopups();
    await page.waitForSelector('[data-testid="property-card"]');

    // Scroll down the page to load more hotels. The number of scrolls can be adjusted based on how many hotels you want to load. 
    for (let i = 0; i < 3; i++) {
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const hotels = await page.evaluate(() => {
        const cards = document.querySelectorAll('[data-testid="property-card"]');

        return Array.from(cards).map(card => {
            const title = card.querySelector('[data-testid="title"]')?.innerText || null;

            const price = card.querySelector('[data-testid="price-and-discounted-price"]')?.innerText || null;

            const rating = card.querySelector('[data-testid="review-score"] div[aria-hidden="true"]')?.innerText || null;

            const link = card.querySelector('a[data-testid="title-link"]')?.href || null;

            return { title, price, rating, link };
        });
    });

    console.log(hotels);

    process.exit();

})();


/**
 * Initializes the Puppeteer browser instance. Depending on the configuration, it either connects to an existing browser instance or launches a new headless browser. 
 * If proxy usage is enabled, it retrieves a random proxy from the database and configures the browser context to use that proxy.
 */
async function initBrowser() {
    const userAgent = new UserAgent({ deviceCategory: 'desktop' });                 // Generate a random desktop user agent.
    if (config.browser_connect) {
        try {
            browser = await puppeteer.connect({ browserURL: config.browser_url });
            console.log("Connected to existing browser instance.");
        } catch (err) {
            console.error("Failed to connect to browser instance. Please ensure the browser is running and accessible at the specified URL.");
            process.exit(1);
        }
    } else {
        browser = await puppeteer.launch({ headless: true });
        console.log("Launched new headless browser instance.");
    }

    if (config.use_proxy) {
        const connection = await dbConnect();
        const [rows] = await connection.execute('SELECT ip, port, username, password FROM proxies ORDER BY RAND() LIMIT 1');
        // we close the database connection immediately after retrieving the proxy information, as we no longer need it. 
        // you should consider using a connection pool for better performance if you plan to run multiple instances of the application.   
        await connection.end();
        if (rows.length === 0) {
            console.error("No proxies found in the database.");
            process.exit(1);
        }
        const proxy = rows[0];
        let proxyUrl = '';

        // we use proxy-chain to anonymize the proxy if it requires authentication. 
        // This is necessary because Puppeteer does not natively support proxies with authentication.  
        if (proxy.username && proxy.password) {
            proxyUrl = `socks5://${proxy.username}:${proxy.password}@${proxy.ip}:${proxy.port}`;
            const anonymizedProxy = await proxyChain.anonymizeProxy(proxyUrl);
            browserContext = await browser.createBrowserContext({ proxyServer: anonymizedProxy });
        } else {
            proxyUrl = `socks5://${proxy.ip}:${proxy.port}`;
            browserContext = await browser.createBrowserContext({ proxyServer: proxyUrl });
        }

        console.log(`Using proxy: ${proxyUrl}`);
    } else {
        browserContext = await browser.createBrowserContext();
    }

    page = await browserContext.newPage();

    await page.setUserAgent(userAgent.data.userAgent);
    await page.setViewport({ width: userAgent.data.viewportWidth, height: userAgent.data.viewportHeight });
    
    // Intercept requests to block images and fonts, which can speed up page loading and reduce bandwidth usage.
    await page.setRequestInterception(true);
    page.on('request', (req) => {       
        if (['image', 'font'].includes(req.resourceType())) {
            req.abort();
        } else {
            req.continue();
        }
    });
}

async function dbConnect() {
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
        host: config.db_host,
        port: config.db_port,
        user: config.db_user,
        password: config.db_password,
        database: config.db_name
    });
    return connection;
}

/**
 * Attempt to close pop-ups about accepting cookies and logging in. This may be necessary in order to scroll down the page.
 * @param {number} retries - The number of retry attempts.
 */

async function closePopups(retries = 3) {
    const popupSelectors = [
        "#onetrust-accept-btn-handler", // Cookie banner    
        '[aria-label="Dismiss sign-in info."]', // Booking.com sign-in prompt
    ];

    var popupsClosed = 0;
    for (let attempt = 0; attempt < retries; attempt++) {
        for (const selector of popupSelectors) {
            try {
                if (await page.$(selector)) {
                    await page.click(selector);
                    console.log(`Pop-up closed: ${selector}`);
                    popupsClosed++;
                }
            } catch (err) {
                console.log(`Selector: ${selector} not found or it couldn't be clicked.`);
            }
        }

        if (popupsClosed >= popupSelectors.length) {
            console.log("All pop-ups closed.");
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait briefly before retrying
    }
}
