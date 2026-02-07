import os
import sys
import requests
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# API Keys
UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_API_KEY", "")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")

def get_weather(city, api_key):
    """Fetch current weather for `city` from OpenWeatherMap Standard API."""
    if not api_key:
        return None
    
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {"q": city, "appid": api_key, "units": "metric"}
    
    try:
        sys.stderr.write(f"DEBUG: Fetching weather for {city} using Standard API\n")
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        
        return {
            "temperature": data["main"]["temp"],
            "description": data["weather"][0]["description"] if data.get("weather") else "",
            "timezone_offset": int(data.get("timezone", 0)),
            "icon": data["weather"][0]["icon"] if data.get("weather") else "",
            "humidity": data["main"]["humidity"],
            "wind_speed": data["wind"]["speed"],
            "coord": data.get("coord", {"lat": 0, "lon": 0})
        }
    except Exception as e:
        sys.stderr.write(f"DEBUG: Weather API error: {e}\n")
        sys.stderr.flush()
        return None

def get_tourism_sites(lat, lon):
    """Fetch nearby tourism sites with details using Wikipedia API."""
    url = "https://en.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "generator": "geosearch",
        "ggscoord": f"{lat}|{lon}",
        "ggsradius": 10000,
        "ggslimit": 5,
        "prop": "extracts|pageimages",
        "exintro": True,
        "explaintext": True,
        "exsentences": 2,
        "pithumbsize": 150,
        "format": "json"
    }
    headers = {
        "User-Agent": "GlobalExplorer/1.0 (contact@example.com)"
    }
    
    try:
        sys.stderr.write(f"DEBUG: Fetching sites for {lat}, {lon}\n")
        resp = requests.get(url, params=params, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        
        sys.stderr.write(f"DEBUG: Wikipedia Response: {data}\n")

        places = []
        pages = data.get("query", {}).get("pages", {})
        
        # Sort by index if possible, but API doesn't allow easy sorting with generator.
        # We'll just take the values.
        for page_id, item in pages.items():
            places.append({
                "title": item.get("title", "Unknown"),
                "description": item.get("extract", "No description available."),
                "thumbnail": item.get("thumbnail", {}).get("source"),
                "url": f"https://en.wikipedia.org/wiki?curid={item['pageid']}"
            })
            
        sys.stderr.write(f"DEBUG: Found {len(places)} places\n")
        return places
    except Exception as e:
        sys.stderr.write(f"DEBUG: Wikipedia API error: {e}\n")
        sys.stderr.flush()
        return []

def get_city_image(city, api_key):
    """Return the URL of the first Unsplash search photo for `city`."""
    if not api_key:
        return None
        
    endpoint = "https://api.unsplash.com/search/photos"
    headers = {"Accept-Version": "v1", "Authorization": f"Client-ID {api_key}"}
    params = {"query": city, "per_page": 1, "orientation": "landscape"}

    try:
        resp = requests.get(endpoint, headers=headers, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        results = data.get("results", [])
        
        if results:
            urls = results[0].get("urls", {})
            return urls.get("regular") or urls.get("full") or urls.get("raw")
    except Exception as e:
        sys.stderr.write(f"DEBUG: Unsplash API error: {e}\n")
        sys.stderr.flush()
        
    return None

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/explore")
def explore():
    city = request.args.get("city")
    if not city:
        return jsonify({"error": "City parameter is required"}), 400
    
    # Prefer headers for keys (client-side override), fallback to server env
    owm_key = request.headers.get("X-OpenWeather-Key") or OPENWEATHER_API_KEY
    unsplash_key = request.headers.get("X-Unsplash-Key") or UNSPLASH_ACCESS_KEY
    
    sys.stderr.write(f"DEBUG: City={city}, OWM_Key_Len={len(owm_key) if owm_key else 0}\n")
    sys.stderr.flush()

    if not owm_key:
         sys.stderr.write("DEBUG: Missing OWM Key\n")
         sys.stderr.flush()
         return jsonify({"error": "OpenWeatherMap API key is missing"}), 401

    weather_data = get_weather(city, owm_key)
    
    # Image is optional but recommended
    image_url = None
    if unsplash_key:
        image_url = get_city_image(city, unsplash_key)
    
    tourism_sites = []
    if weather_data and "coord" in weather_data:
        lat = weather_data["coord"]["lat"]
        lon = weather_data["coord"]["lon"]
        tourism_sites = get_tourism_sites(lat, lon)
    
    if not weather_data:
        sys.stderr.write("DEBUG: Weather data is None after fetch attempt\n")
        sys.stderr.flush()
        return jsonify({"error": "Could not fetch weather data. Check city name or API key."}), 404
        
    return jsonify({
        "city": city,
        "weather": weather_data,
        "image_url": image_url,
        "tourism": tourism_sites
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)
