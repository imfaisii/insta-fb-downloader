import puppeteer from 'puppeteer';

const args = process.argv;

var success = {
    bool: false,
    status: "success",
    code: 200,
    message: "Action successful",
    data: {}
};

var error = {
    bool: false,
    status: "error",
    code: 400,
    message: "Action failed",
    data: {}
}

function setSuccess(data) {
    success = {
        bool: true,
        status: "success",
        code: 200,
        message: "Action successful.",
        data: data
    };

    error.bool = false
    console.log(success)
}

function setError(data) {
    error = {
        bool: true,
        status: "error",
        code: 400,
        message: "Action failed.",
        data: data
    };

    success.bool = false
    console.log(error)
}

async function scrapFacebook(page, url) {

    await page.goto(url, { waitUntil: 'load' })

    let content = await page.content()

    if (content.includes('playable_url_dash')) {
        let json = content.split('"playable_url_dash":').pop().split(',"spherical_video_fallback_urls')[0];
        json = JSON.parse(`{"playable_url_dash":${json}}`)
        json.video_url = json?.playable_url_quality_hd
        setSuccess(json)

    } else setError('Video url cannot be fetched or invalid url.')
}

async function scrapInstagram(page, url) {
    await page.goto(url); // wait until page load

    const [response] = await Promise.all([
        page.waitForResponse(response => response.url().startsWith("https://www.instagram.com/graphql/query/?query_hash="))
    ]);

    const res = await response.json();

    setSuccess({
        full_name: res.data.shortcode_media.owner.full_name,
        username: res.data.shortcode_media.owner.username,
        profile_pic_url: res.data.shortcode_media.owner.profile_pic_url,
        video_duration: res.data.shortcode_media.video_duration,
        thumbnail: res.data.shortcode_media.thumbnail_src,
        video_url: res.data.shortcode_media.video_url,
        total_views: res.data.shortcode_media.video_view_count
    });
}

async function scrap(platform = 'facebook', url, headless = true) {
    const browser = await puppeteer.launch({ headless: headless });

    const page = await browser.newPage();

    await page.setViewport({ width: 1200, height: 720 });

    if (platform == 'facebook') {
        /* FACEBOOK BLOCK */

        if (!url.includes('https://www.facebook.com/')) {
            setError('Invalid facebook url. e.g: https://www.facebook.com/watch?v=567231208557797')
        }

        else await scrapFacebook(page, url)

    } else if (platform == 'instagram') {
        /* INSTAGRAM BLOCK */

        if (!url.includes('https://www.instagram.com/')) {
            setError('Invalid instagram url. e.g: https://www.instagram.com/reel/CmPT92rDfP4/')
        }

        else await scrapInstagram(page, url)
    } else setError('This plaform is not yet supported. ( Supported platforms are : facebook and instagram )')

    await browser.close();
}

function isUrl(str) {
    const urlPattern = /^(?:\w+:)?\/\/([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/;
    return urlPattern.test(str);
}


(async function () {
    const data = JSON.parse(args[args.length - 1]);

    if (!isUrl(data.url)) {
        return setError(["Invalid url"]);
    }

    await scrap(data.platform, data.url, true)
})()
