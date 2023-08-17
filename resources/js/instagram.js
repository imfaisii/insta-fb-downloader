const puppeteer = require('puppeteer');

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
      "bool": true,
      "status": "success",
      "code": 200,
      "message": "Action successful.",
      "data": data
  };

  error.bool = false
  console.log(success)
}

(async () => {
  // Get the URL from the command line
  const url = process.argv[2];
  
  if (!url) {
    console.error('Please provide a URL as a command line argument.');
    process.exit(1);
  }

  // Launch a headless browser
  const browser = await puppeteer.launch({
    // headless: false
  });
  const page = await browser.newPage();

  try {
    // Visit the provided URL
    await page.goto(url);

    // Wait for the API response
    const response = await page.waitForResponse(response => {
      return response.url().includes('https://www.instagram.com/graphql/query/?query_hash=');
    });

    // Get the data from the response
    const res = await response.json();

    console.log(res.data.shortcode_media.video_url)
    
  //   console.log({
  //     "full_name": res.data.shortcode_media.owner.full_name,
  //     "username": res.data.shortcode_media.owner.username,
  //     "profile_pic_url": res.data.shortcode_media.owner.profile_pic_url,
  //     "video_duration": res.data.shortcode_media.video_duration,
  //     "thumbnail": res.data.shortcode_media.thumbnail_src,
  //     "video_url": res.data.shortcode_media.video_url,
  //     "total_views": res.data.shortcode_media.video_view_count
  // });
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    // Close the browser
    await browser.close();
  }
})();