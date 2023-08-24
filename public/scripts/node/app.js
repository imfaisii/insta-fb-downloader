const puppeteer = require("puppeteer");
const fs = require("fs").promises;

const args = process.argv.slice(2);
const INSTAGRAM_COOKIES_PATH = "./cookies/instagram.json";

// server conf
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000; // Change this to your desired port number

app.use(express.json());
app.use(cors());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header(
        "Access-Control-Allow-Methods",
        "PUT, GET, POST, DELETE, OPTIONS"
    );
    next();
});

async function login(page) {
    // Navigate to the target page
    await page.goto("https://instagram.com");

    // Wait for the input fields to load
    await page.waitForSelector('input[name="username"]');
    await page.waitForSelector('input[name="password"]');

    // Enter the username and password
    await page.type('input[name="username"]', "imfaisii7");
    await page.type('input[name="password"]', "Pakistan2021");

    // Find and click the submit button
    await page.click('button[type="submit"]');

    // Wait for the next page to load (you might need to adjust the selector)
    await page.waitForNavigation();

    // Get cookies after logging in
    const cookies = await page.cookies();

    // Save cookies to a file for later use
    fs.writeFile(INSTAGRAM_COOKIES_PATH, JSON.stringify(cookies), (err) => {});
}

async function getMediaApiData(page, storyUrl) {
    console.log("Getting media api data");
    // Navigate to the target page
    await page.goto(storyUrl);

    console.log("Page loaded");
    // wait for response from media api
    const mediaApiResponse = await page.waitForResponse((response) => {
        return response.url().includes("api/v1/feed/reels_media");
    });

    console.log("Media api response received");
    // getting the json data from api call
    return await mediaApiResponse.json();
}

app.post("/process", async (req, res) => {
    const { url } = req.body;

    if(!url || url == '') {
        res.json({
            status: false,
            message: "Invalid/Empty URL"
        })
    }

    res.json({
        message: "OCR process completed successfully.",
    });

    return;
    if (args.length === 0) {
        console.log("Please provide the story url as an argument");
        return;
    }

    console.log("Starting the script");

    // Launch a headless browser instance
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            "--disable-gpu",
            "--ignore-certificate-errors",
            "--disable-web-security",
            "--disable-features=IsolateOrigins",
            "--disable-site-isolation-trials",
            "--autoplay-policy=user-gesture-required",
            "--disable-background-networking",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-breakpad",
            "--disable-client-side-phishing-detection",
            "--disable--component-update",
            "--disable-default-apps",
            "--disable-dev-shm-usage",
            "--disable-domain-reliability",
            "--disable-extensions",
            "--disable-features=AudioServiceOutOfProcess",
            "--disable-hang-monitor",
            "--disable-ipc-flooding-protection",
            "--disable-notifications",
            "--disable-offer-store-unmasked-wallet-cards",
            "--disable-popup-blocking",
            "--disable-print-preview",
            "--disable-prompt-on-repost",
            "--disable-renderer-backgrounding",
            "--disable-setuid-sandbox",
            "--disable-speech-api",
            "--disable-sync",
            "--hide-scrollbars",
            "--ignore-gpu-blacklist",
            "--metrics-recording-only",
            "--mute-audio",
            "--no-default-browser-check",
            "--no-first-run",
            "--no-pings",
            "--no-sandbox",
            "--no-zygote",
            "--password-store=basic",
            "--use-gl=swiftshader",
            "--use-mock-keychain",
            "--disable-web-security",
            "--disable-features=IsolateOrigins",
            "--disable-site-isolation-trials",
            "--disable-features=BlockInsecurePrivateNetworkRequests",
        ],
    });

    console.log("Browser launched");

    // Open a new page
    const page = await browser.newPage();

    // Check if cookies file exists and load cookies if present
    try {
        const cookiesString = await fs.readFile(
            INSTAGRAM_COOKIES_PATH,
            "utf-8"
        );
        const cookies = JSON.parse(cookiesString);
        await page.setCookie(...cookies);
    } catch (error) {
        console.log("Cookies file doesn't exist or couldn't be loaded.");
    }

    console.log("Page opened");
    // setting up intercepter
    await page.setRequestInterception(true);

    console.log("Request interception enabled");
    // aborting all requests except document
    page.on("request", (request) => {
        if (request.url().includes("login")) {
            console.log("Login request intercepted", request.url());
        }

        if (
            request.resourceType() === "stylesheet" ||
            request.resourceType() === "image"
        ) {
            request.abort();
        } else {
            request.continue();
        }
    });

    console.log("Request interception setup");
    // login user
    // await login(page);

    console.log("User logged in");
    // get api data
    const mediaApiData = await getMediaApiData(page, args[0]);

    //! FOR DEBUGGING purposes writing the data to a file
    // fs.writeFile(
    //     "output.txt",
    //     JSON.stringify(mediaApiData["reels_media"][0]["items"]),
    //     (err) => {
    //         if (err) {
    //             console.error("Error writing to file:", err);
    //         } else {
    //             console.log("Data has been written to the file.");
    //         }
    //     }
    // );

    // processing the data
    const processedData = mediaApiData["reels_media"][0]["items"].map(
        (item) => {
            const isImage = !item.hasOwnProperty("video_versions");

            let url;
            if (isImage) {
                const firstImageCandidate = item.image_versions2.candidates[0];
                url = firstImageCandidate ? firstImageCandidate.url : null;
            } else {
                const firstVideoVersion = item.video_versions[0];
                url = firstVideoVersion ? firstVideoVersion.url : null;
            }

            return { is_image: isImage, url };
        }
    );

    console.log(processedData);

    // Close the browser
    await browser.close();
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} with cors`);
});
