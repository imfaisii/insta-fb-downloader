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

def get_driver(data):
    # Configure Chrome options
    chrome_options = webdriver.ChromeOptions()

    if not data['showBrowser']:
        chrome_options.add_argument("--headless=new")

    chrome_options.add_argument("--window-size=1920x1080")
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')

    # Initialize the Chrome webdriver
    return webdriver.Chrome(options=chrome_options)

def get_representations(data):
    driver = get_driver(data)

    try:
        # Load the URL and wait for the page to fully load
        driver.get(data['url'])
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "video")))

        # Extract the page source and create a BeautifulSoup object
        page_source = driver.page_source
        soup = BeautifulSoup(page_source, "html.parser")
        start_substring = "[{\"representations\":"
        end_substring = ",\"video_id\""

        return find_between(soup.prettify(),start_substring,end_substring)

    finally:
        # Close the browser window
        driver.quit()

def get_instagram_representations(data):
    driver = get_driver(data)

    try:
        # Load the URL and wait for the page to fully load
        driver.get(data['url'])
        
        video_element = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "video")))

        # Get the 'src' attribute of the <video> tag
        video_src = video_element.get_attribute('src')

        return video_src

    finally:
        # Close the browser window
        driver.quit()

if __name__ == "__main__":
    json_data = json.loads(sys.argv[1])

    if(json_data['platform'] == "facebook"):
        representations = get_representations(json_data)
        if representations:
            print(json.dumps(representations, indent=2))
    elif(json_data['platform'] == "instagram"):
        print(get_instagram_representations(json_data))
    else:
        print("Platform not supported")
