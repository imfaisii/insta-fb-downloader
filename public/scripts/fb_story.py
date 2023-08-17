import json
import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup

def find_between( s, first, last ):
    try:
        start = s.index( first ) + len( first )
        end = s.index( last, start )
        return s[start:end]
    except ValueError:
        return ""
def get_representations(url):
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--window-size=1920x1080")
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')

    driver = webdriver.Chrome(options=chrome_options)

    try:
        driver.get(url)
        driver.implicitly_wait(10)

        stories_elements = driver.find_elements(By.XPATH, "//div[@class='oajrlxb2 g5ia77u1 qu0x051f esr5mh6w e9989ue4 r7d6kgcz rq0escxv nhd2j8a9 j83agx80 bp9cbjyn']")

        video_urls = []

        
        # Extract the page source and create a BeautifulSoup object
        page_source = driver.page_source
        soup = BeautifulSoup(page_source, "html.parser")
        start_substring = "[{\"representations\":"
        end_substring = ",\"video_id\""
        # print(find_between(soup.prettify(),start_substring,end_substring))
        return find_between(soup.prettify(),start_substring,end_substring)

        for index, story_element in enumerate(stories_elements):
            story_element.click()
            time.sleep(5)

            video_element = driver.find_element(By.TAG_NAME, 'video')
            video_url = video_element.get_attribute('src')
            video_urls.append(video_url)

        return video_urls
    finally:
        driver.quit()

if __name__ == "__main__":
    json_data = json.loads(sys.argv[1])

    if json_data['platform'] == "facebook":
        video_urls = get_representations(json_data['url'])
        if video_urls:
            print(json.dumps(video_urls, indent=2))
    else:
        print("Platform not supported")
