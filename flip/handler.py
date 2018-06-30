import json
import requests

# Lambda-specfic stuff
CORS_HEADER = {
    "Access-Control-Allow-Origin" : "*",
    "Access-Control-Allow-Credentials" : True
}

# Search Stuff
SEARCH_BASE_URL = 'https://contextualwebsearch.com'
SEARCH_PATH = '/api/Search/'
WEB_SEARCH_PATH = 'WebSearchAPI'
NEWS_SEARCH_PATH = 'NewsSearchAPI'
IMAGE_SEARCH_PATH = 'ImageSearchAPI'

WEB_SEARCH_URL = '{}{}{}'.format(SEARCH_BASE_URL, SEARCH_PATH, WEB_SEARCH_PATH)
NEWS_SEARCH_URL = '{}{}{}'.format(SEARCH_BASE_URL, SEARCH_PATH, NEWS_SEARCH_PATH)
IMAGE_SEARCH_URL = '{}{}{}'.format(SEARCH_BASE_URL, SEARCH_PATH, IMAGE_SEARCH_PATH)

# Flipboard Stuff
FLIP_BASE_URL = 'https://flipboard.com'
FLIP_UPDATEFEED_PATH = '/api/users/updateFeed'
FLIP_UPDATEFEED_URL  = '{}{}'.format(FLIP_BASE_URL, FLIP_UPDATEFEED_PATH)

FEED_DAILY_EDITION = 'sid/3adc9613z/news'
FEED_10TODAY = 'sid/k6ln1khuz/flipboard'
FEED_PHOTODESK = 'sid/cpjmjjkiz/thephotodesk'

SECTION_PARAM_MAP = {
    '10today':FEED_10TODAY,
    'de':FEED_DAILY_EDITION,
    'photodesk':FEED_PHOTODESK,
}

ARGS = {
    "wantsMetadata":"false",
    "nostream":"true",
    "nosidebar":"true",
}

ITEM_GROUP = 'group'
ITEM_POST = 'post'
ITEM_SECTION = 'section'
ALLOWED_FEED_ITEM_TYPES = (ITEM_GROUP, ITEM_POST, ITEM_SECTION, )

class Item(object):
    def __init__(self, item):
        image = item.get('inlineImage', {})
        for k,v in image.items():
            # AMP only supports HTTPS images.
            if isinstance(v, basestring):
                image[k] = v.replace("http://","https://")

        self.data = dict(
            title = item.get('title'),
            url = item.get('sourceURL', ''),
            image = item.get('inlineImage', {}),
            more_images = [i for i in item.get('inlineItems', []) if i.get('type') == 'image'],
            items = [Item(i).data for i in item.get('items', [])]
        )          
        
    def json(self):
        return self.data


def fetchit(url, params = None):
    body = requests.get(url, params=params)
    return body.json()

def cors_response(data):
    response = {
        "headers": CORS_HEADER,
        "statusCode": 200,
        "body": json.dumps({
            "items": data
        })
    }
    return response

def updateFeed(event, context):
    params = event.get("queryStringParameters", {})
    section_id = SECTION_PARAM_MAP.get(params.get('feed', None), None) or FEED_DAILY_EDITION
    feed_args = {
        "sections":section_id,
        "limit":params.get('limit', 10)
    }
    feed_args.update(ARGS)
    foo = fetchit(FLIP_UPDATEFEED_URL, params=feed_args)
    items = [Item(f) for f in foo.get('stream') if f.get("type") in ALLOWED_FEED_ITEM_TYPES]
    return cors_response([i.json() for i in items])

def search(event, context):
    params = event.get("queryStringParameters", {})
    data = {
        "q":params.get("q","werewolf"),
        "autoCorrect":params.get("autoCorrect", "false"),
        "count":params.get("count", 10)
    }
    foo = fetchit(WEB_SEARCH_URL, params=data)
    items = foo.get('value')
    return cors_response([i for i in items])
