import requests
import sys
import random
from fake_useragent import UserAgent
from requests.utils import unquote

if len(sys.argv) < 2:
    print("Please provide a URL as an argument.")
    # use the url variable here
else:
    # define the URL to visit
    url = sys.argv[1]

    # generate a random user agent
    user_agent = UserAgent().random

    # generate a random IP address
    ip = ".".join(str(random.randint(0, 255)) for _ in range(4))

    # define the headers to use in the request
    headers = {
        "User-Agent": user_agent,
        "X-Forwarded-For": ip,
        "Referer": "https://www.google.com/",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive"
    }

    # send the request to the URL
    response = requests.get(url, headers=headers)
    response_content = response.content
    string = unquote(response_content.decode())

    start = 'contentUrl":"'
    end = '","thumbnailUrl'

    # get the video url
    result = string[string.index(start)+len(start):string.index(end)].strip()
    result = result.replace("\\", "").replace("u0025", "%")

    # print the response content
    print(result)
