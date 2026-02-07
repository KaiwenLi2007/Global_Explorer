import requests
import json

def test_wiki():
    lat = 51.5074
    lon = -0.1278
    
    url = "https://en.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "list": "geosearch",
        "gscoord": f"{lat}|{lon}",
        "gsradius": 10000,
        "gslimit": 5,
        "format": "json"
    }
    
    print(f"Testing Wikipedia API for Lat: {lat}, Lon: {lon}")
    try:
        resp = requests.get(url, params=params, timeout=10)
        print(f"Status Code: {resp.status_code}")
        data = resp.json()
        print("Response found items:", len(data.get("query", {}).get("geosearch", [])))
        print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_wiki()
