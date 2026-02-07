Global Explorer
===============

Global Explorer is a web application that provides real-time weather, images, and tourism recommendations for cities worldwide.

How to Run
----------

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the server:
   ```bash
   python server.py
   ```

3. Open your browser and navigate to:
   `http://localhost:5000`

Features
--------

- Real-time weather data via OpenWeatherMap.
- Dynamic background images from Unsplash.
- Points of interest and descriptions via Wikipedia.
- "Surprise Me" random destination generator.

APIs Used
---------

This application utilizes the following external APIs:
- **OpenWeatherMap API**: Used for fetching current weather data (User Need to Install API Keys Themselves).
- **Unsplash API**: Used for sourcing city imagery (User Need to Install API Keys Themselves).
- **Wikipedia API**: Used for local points of interest and site descriptions (Public API).
