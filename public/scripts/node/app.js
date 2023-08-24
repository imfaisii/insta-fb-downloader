const puppeteer = require("puppeteer");
const fs = require("fs");

const args = process.argv.slice(2);

async function login(page) {
    // Navigate to the target page
    await page.goto("https://instagram.com");

    // Wait for the input fields to load
    await page.waitForSelector('input[name="username"]');
    await page.waitForSelector('input[name="password"]');

    // Enter the username and password
    await page.type('input[name="username"]', "imfaisii4");
    await page.type('input[name="password"]', "Pakistan2021");

    // Find and click the submit button
    await page.click('button[type="submit"]');

    // Wait for the next page to load (you might need to adjust the selector)
    await page.waitForNavigation();
}

async function getMediaApiData(page, storyUrl) {
    // Navigate to the target page
    await page.goto(storyUrl);

    // wait for response from media api
    const mediaApiResponse = await page.waitForResponse((response) => {
        return response.url().includes("api/v1/feed/reels_media");
    });

    // getting the json data from api call
    return await mediaApiResponse.json();
}

(async () => {
    if (args.length === 0) {
        console.log("Please provide the story url as an argument");
        return;
    }

    // Launch a headless browser instance
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            "--disable-gpu",
            "--disable-setuid-sandbox",
            "--no-sandbox",
            "--ignore-certificate-errors",
            "--disable-web-security",
            "--disable-features=IsolateOrigins",
            "--disable-site-isolation-trials",
        ],
    });

    // Open a new page
    const page = await browser.newPage();

    // setting up intercepter
    await page.setRequestInterception(true);

    page.on("request", (request) => {
        if (
            request.resourceType() === "stylesheet" ||
            request.resourceType() === "image"
        ) {
            request.abort();
        } else {
            request.continue();
        }
    });

    // login user
    await login(page);

    // get api data
    const mediaApiData = await getMediaApiData(page, args[0]);

    //! FOR DEBUGGING purposes writing the data to a file
    fs.writeFile(
        args[1],
        JSON.stringify(mediaApiData["reels_media"][0]["items"]),
        (err) => {
            if (err) {
                console.error("Error writing to file:", err);
            } else {
                console.log("Data has been written to the file.");
            }
        }
    );

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
})();
