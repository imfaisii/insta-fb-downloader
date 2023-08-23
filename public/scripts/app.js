const puppeteer = require("puppeteer");

(async () => {
    // Launch a headless browser instance
    const browser = await puppeteer.launch();

    // Open a new page
    const page = await browser.newPage();

    // Navigate to the target page
    await page.goto("https://instagram.com");

    // Wait for the input fields to load
    await page.waitForSelector('input[name="username"]');
    await page.waitForSelector('input[name="password"]');

    // Enter the username and password
    await page.type('input[name="username"]', "your_username");
    await page.type('input[name="password"]', "your_password");

    // Find and click the submit button
    await page.click('button[type="submit"]');

    // Wait for the next page to load (you might need to adjust the selector)
    await page.waitForNavigation();

    // Navigate to the target page
    await page.goto("https://instagram.com");

    // Do something on the next page if needed

    // Close the browser
    await browser.close();
})();
