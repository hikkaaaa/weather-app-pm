this the project that will track and give 5-day forecast of the weather of any country the user inputs

the input of the user can be of several types: Zip Code/Postal Code, GPS Coordinates, Landmarks, Town, City, etc..

Here is the structure of the project for an easy navigation: 

weather-app-pm-accelerator/
│
├── backend/                     # Python backend
│   ├── app/                     # FastAPI app code
│   │   ├── __init__.py
│   │   ├── main.py              # Entry point, FastAPI app instance
│   │   ├── routes/              # All API endpoints
│   │   │   ├── weather.py       # Weather-related routes (current & forecast)
│   │   │   └── crud.py          # CRUD endpoints
│   │   ├── models/              # SQLAlchemy models / database tables
│   │   │   └── weather.py #storing weather searches
│   │   ├── database.py          # DB connection and session
│   │   └── utils.py             # Helper functions (API calls, validation), it is used to identify the user input's type
│   ├── requirements.txt         # Python dependencies
│   └── .env                     # Environment variables (API keys, DB URI)
│
├── frontend/                    # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── WeatherForm.jsx
│   │   │   ├── WeatherDisplay.jsx
│   │   │   └── Forecast.jsx
│   │   ├── pages/               # If you want routing (optional)
│   │   │   └── Home.jsx
│   │   ├── services/            # API service functions
│   │   │   └── weatherService.js
│   │   ├── App.jsx
│   │   └── index.js
│   ├── package.json
│   └── .env                     # Optional: frontend env vars (API URL)
│
├── README.md
└── demo-video/                  # Optional: record your demo

Backend

main.py → start FastAPI server

routes/ → separate endpoints for weather API calls and CRUD operations

models/ → define your SQL database tables with SQLAlchemy

database.py → handles DB connection & sessions

utils.py → reusable functions: fetch weather API, validate location, parse data

Frontend

components/ → modular pieces: form to enter location, display current weather, forecast

services/ → functions that call backend endpoints (fetchWeather, getForecast, CRUD ops)

pages/ → if you want multiple pages (like /history for CRUD view)

.env → store backend URL or API keys if needed

Root

README.md → instructions for running backend + frontend

demo-video/ → store your demo before uploading (or just a link)


.env (PRIVATE – NEVER COMMITTED)
Contains real secrets

Used by your app at runtime

Different for every developer, machine, or environment

.env.example (PUBLIC – COMMITTED)

Acts as documentation

Shows:

Which environment variables are required

What names they must have

Contains fake / placeholder values


backend: 
1) Create FastAPI app
2) Load API key from .env
3) Call OpenWeather API
4) Return clean JSON

run the backend:
the backend folder: 
1) cd backend
2) python3 -m venv venv #or simply python -m venv venv if you dont have python3
3) source venv/bin/activate #virtual environment for macOS/Linux
4) pip install -r requirements.txt #install the requirements
5) uvicorn app.main:app #run the server

| Type                    | Example        | OpenWeather param             |
| ----------------------- | -------------- | ----------------------------- |
| City                    | `London`       | `q`                           |
| City + Country          | `London,GB`    | `q`                           |
| ZIP / Postal Code       | `10001,US`     | `zip`                         |
| Coordinates             | `51.51,-0.13`  | `lat` + `lon`                 |
| Landmarks / other names | `Eiffel Tower` | `q` (may need fuzzy handling) |

dt_txt → date & time

main.temp → temperature

weather[0].description → weather description

weather[0].icon → weather icon


{
  "location": "user input",
  "city": "London",
  "country": "GB",
  "forecast": [
     {"datetime": "2026-01-20 12:00:00", "temperature": 12, "feels_like": 11, "humidity": 80, "weather": "cloudy", "icon": "04d"},
     ...
  ]
}

Only show one reading per day (e.g., midday) instead of 3-hour intervals

Group by day:

daily_forecast = {}
for item in data["list"]:
    date = item["dt_txt"].split(" ")[0]
    if date not in daily_forecast:
        daily_forecast[date] = item


This makes it easier for the frontend to show a 5-day summary


the program will show the 5-day forecast in 3h interval



