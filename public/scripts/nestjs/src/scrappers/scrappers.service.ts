import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
import { createFile, getFile } from 'src/helpers/storage';
import {
    BROWSER_OPTIONS,
    COOKIES_PATH,
    INSTAGRAM_COOKIES_FILE_NAME,
} from './constants/main';
import { sleep } from '@src/helpers/global';

@Injectable()
export class ScrappersService {
    async scrap(): Promise<any> {
        // launch browser
        console.log('Launching browser');
        const browser = await puppeteer.launch({
            headless: false,
            args: BROWSER_OPTIONS,
        });

        // Open a new page
        const page = await browser.newPage();

        // setting up intercepter
        console.log('Enabling intercepter');
        await page.setRequestInterception(true);

        // aborting all requests except document
        console.log('Request interception enabled');
        page.on('request', (request) => {
            if (request.url().includes('login')) {
                console.log('Login request intercepted', request.url());
            }

            if (
                request.resourceType() === 'stylesheet' ||
                request.resourceType() === 'image'
            ) {
                request.abort();
            } else {
                request.continue();
            }
        });

        // Check if cookies file exists and load cookies if present
        try {
            console.log('Loading cookies');
            const path = COOKIES_PATH + '/' + INSTAGRAM_COOKIES_FILE_NAME;
            const cookiesString: any = await getFile(path, 'utf8');
            const cookies = JSON.parse(cookiesString);
            await page.setCookie(...cookies);
        } catch (error) {
            console.log("Cookies file doesn't exist or couldn't be loaded.");
        }

        const mediaApiData = await this.getMediaApiData(
            page,
            'https://www.instagram.com/stories/imfaisii4/3176208161126361511/',
        );

        // processing the data
        const data = mediaApiData['reels_media'][0]['items'].map(
            (item: any) => {
                const isImage = !item.hasOwnProperty('video_versions');

                let url;
                if (isImage) {
                    const firstImageCandidate =
                        item.image_versions2.candidates[0];
                    url = firstImageCandidate ? firstImageCandidate.url : null;
                } else {
                    const firstVideoVersion = item.video_versions[0];
                    url = firstVideoVersion ? firstVideoVersion.url : null;
                }

                return { is_image: isImage, url };
            },
        );

        return { data };
    }

    async login(page: any): Promise<any> {
        // Navigate to the target page
        await page.goto('https://instagram.com');

        // Wait for the input fields to load
        await page.waitForSelector('input[name="username"]');
        await page.waitForSelector('input[name="password"]');

        // Enter the username and password
        await page.type('input[name="username"]', 'imfaisii7');
        await page.type('input[name="password"]', 'Pakistan2021');

        // Find and click the submit button
        await page.click('button[type="submit"]');

        // Wait for the next page to load (you might need to adjust the selector)
        await page.waitForNavigation();
    }

    async getMediaApiData(page: any, storyUrl: string) {
        console.log('Getting media api data');
        // Navigate to the target page
        await page.goto(storyUrl);
        await page.waitForNavigation();

        console.log('Waiting for api');
        // wait for response from media api
        const mediaApiResponse = await page.waitForResponse((response: any) => {
            return response.url().includes('api/v1/feed/reels_media');
        });

        console.log('Media api response received');
        // getting the json data from api call
        return await mediaApiResponse.json();
    }

    async saveCookies(page: any): Promise<any> {
        // Get cookies after logging in
        const cookies = await page.cookies();

        // Use cookies in other tab or browser
        await createFile(
            COOKIES_PATH,
            INSTAGRAM_COOKIES_FILE_NAME,
            JSON.stringify(cookies),
        );
    }
}
