from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
import json

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
        # Load the URL and wait for the page to fully load
        driver.get(url)
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

if __name__ == "__main__":
    url = "https://fb.watch/lMSBvn4r_E/?mibextid=Nif5oz"
    representations = get_representations(url)
    if representations:
        print(json.dumps(representations, indent=2))
