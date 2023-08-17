from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
import json
import sys

def find_between( s, first, last ):
    try:
        start = s.index( first ) + len( first )
        end = s.index( last, start )
        return s[start:end]
    except ValueError:
        return ""

def get_representations(url):
    # Configure Chrome options
    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--window-size=1920x1080")
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')

    # Initialize the Chrome webdriver
    driver = webdriver.Chrome(options=chrome_options)

    try:
        # Load the webpage
        driver.get(url)

        # Wait for the page to fully load
        video = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "video")))
       

        # Get the page source
        page_source = driver.page_source

        # Parse the HTML content using BeautifulSoup
        soup = BeautifulSoup(page_source, 'html.parser')
        start_substring = "[{\"representations\":"
        end_substring = ",\"video_id\""
        
        return find_between(soup.prettify(), start_substring, end_substring)
      
        # Find video elements and extract video URLs
        video_tags = soup.find_all('video')
        video_urls = []

        for video_tag in video_tags:
            video_url = video_tag.get('src')
            if video_url:
                video_urls.append(video_url)

        # Print the extracted video URLs
        for video_url in video_urls:
            print(video_url)

    finally:
        # Close the browser window
        driver.quit()

if __name__ == "__main__":
    json_data = json.loads(sys.argv[1])

    if(json_data['platform'] == "facebook"):
        representations = get_representations(json_data['url'])
        if representations:
            print(json.dumps(representations, indent=2))
    else:
        print("Platform not supported")
