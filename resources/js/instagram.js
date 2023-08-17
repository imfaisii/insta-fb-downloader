const puppeteer = require("puppeteer");

var success = {
    bool: false,
    status: "success",
    code: 200,
    message: "Action successful",
    data: {},
};

var error = {
    bool: false,
    status: "error",
    code: 400,
    message: "Action failed",
    data: {},
};

function setSuccess(data) {
    success = {
        bool: true,
        status: "success",
        code: 200,
        message: "Action successful.",
        data: data,
    };

    error.bool = false;
    console.log(success);
}

(async () => {
    // Get the URL from the command line
    const url = process.argv[2];

    if (!url) {
        console.error("Please provide a URL as a command line argument.");
        process.exit(1);
    }

    // Launch a headless browser
    const browser = await puppeteer.launch({
        headless: false,
    });
    const page = await browser.newPage();

    try {
        // Visit the provided URL
        await page.goto(url);

        // Wait for the video tag to appear
        const videoElement = await page.waitForSelector("video");

        // Get the src attribute of the video element
        const videoSrc = await videoElement.evaluate((element) => element.src);

        console.log(videoSrc);
    } catch (error) {
        console.error("An error occurred:", error);
    } finally {
        // Close the browser
        await browser.close();
    }
})();
