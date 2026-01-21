this the project that will track and give 5-day forecast of the weather of any country the user inputs

the input of the user can be of several types: Zip Code/Postal Code, GPS Coordinates, Town, City, City Country

| Type                    | Example        | OpenWeather param             |
| ----------------------- | -------------- | ----------------------------- |
| City                    | `London`       | `q`                           |
| City + Country          | `London,GB`    | `q`                           |
| ZIP / Postal Code       | `10001,US`     | `zip`                         |
| Coordinates             | `51.51,-0.13`  | `lat` + `lon`                 |

Here is the structure of the backend of the project for an easy navigation: 

weather-app-pm-accelerator/
│
├── backend/                     # Python backend
│   ├── app/                     # FastAPI app code
│   │   ├── __init__.py
│   │   ├── main.py              # Entry point, FastAPI app instance
│   │   ├── models/              # SQLAlchemy models / database tables
│   │   │   └── weather.py       #storing weather searches
│   │   ├── database.py          # DB connection and session
│   │   └── utils.py             # Helper functions (API calls, validation), it is used to identify the user input's type
│   ├── requirements.txt         # Python dependencies
│   └── .env                     # Environment variables (API keys, DB URI)
├── README.md

Backend

main.py - start FastAPI server

models/ - define SQL database tables with SQLAlchemy

database.py - handles DB connection & sessions

utils.py - reusable function: parse data

Root

README.md - instructions for running backend + frontend

.env - contains real secrets

backend information: 
1) stack is Python - FastAPI app
2) loads API key from .env
3) call OpenWeather API
4) returns clean JSON
5) the program can show the 5-day forecast in 3h interval - can be tested clearly in /docs


How to run the server:
1) run the backend: 
   cd backend
   python3 -m venv venv #or simply python -m venv venv if you dont have python3
   source venv/bin/activate #virtual environment for macOS/Linux
   pip install -r requirements.txt #install the requirements
   uvicorn app.main:app #run the server
2) run the frontend from another terminal: 
   cd frontend
   npm install 
   npm start


