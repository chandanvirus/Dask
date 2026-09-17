# DASK

DASK is a full-stack employee attendance and leave management project with a FastAPI backend and a vanilla HTML/CSS/JavaScript frontend.

## Features

- Employee registration and login
- Admin and employee dashboard views
- Attendance tracking
- Leave application and approval flow
- Holiday management
- Reports and profile pages in the frontend
- Chart-based dashboard widgets

## Project Structure

```text
Dask/
|-- Project2/
|   |-- Backend/
|   |   |-- main.py
|   |   |-- database.py
|   |   |-- db_models.py
|   |   |-- schemas.py
|   |   `-- requirements.txt
|   `-- Frontend/
|       |-- home.html
|       |-- index.html
|       |-- attendance.html
|       |-- leaves.html
|       |-- holidays.html
|       |-- reports.html
|       |-- profile.html
|       |-- *.js
|       |-- style.css
|       `-- images/
`-- README.md
```

## Tech Stack

- Backend: FastAPI, SQLAlchemy, Uvicorn
- Database: PostgreSQL
- Frontend: HTML, CSS, JavaScript
- Charts: Chart.js

## Backend Setup

1. Create and activate a Python virtual environment.
2. Install the backend dependencies:

```bash
cd Project2/Backend
pip install -r requirements.txt
pip install python-dotenv
```

3. Set the database connection string in an environment variable named `DATABASE_URL`.

Example:

```env
DATABASE_URL=postgresql://user:password@localhost/dbname
```

4. Start the API server:

```bash
uvicorn main:app --reload
```

The backend runs on `http://127.0.0.1:8000`.

## Frontend Setup

The frontend is written as static files and expects to be served locally. The backend CORS configuration currently allows:

- `http://127.0.0.1:5500`
- `http://localhost:5500`

To run the frontend:

1. Open the `Project2/Frontend` folder in a static server.
2. Serve it on port `5500`.
3. Start from `home.html`.

If you use the VS Code Live Server extension, this matches the current backend CORS setup.

## Available Pages

- `home.html`: landing page with login and registration modal
- `index.html`: main dashboard
- `attendance.html`: attendance management
- `leaves.html`: leave requests
- `holidays.html`: holiday list
- `reports.html`: reports page
- `profile.html`: employee profile

## API Overview

Current backend routes in `Project2/Backend/main.py`:

- `GET /`: basic API message
- `GET /health`: health check
- `POST /employees`: create employee
- `GET /employees`: list employees
- `POST /holidays`: create holiday
- `GET /holidays`: list holidays
- `POST /attendance`: mark attendance
- `GET /attendance`: list attendance records
- `POST /login`: authenticate user
- `POST /leaves`: apply for leave
- `GET /leaves`: list leave requests
- `PUT /leaves/{leave_id}`: update leave status

## Notes

- Tables are created automatically on backend startup via SQLAlchemy metadata.
- The frontend fetches API data from `http://127.0.0.1:8000`.
- Passwords are currently stored and checked as plain text in the backend.
- `python-dotenv` is used by `database.py` but is not currently listed in `Project2/Backend/requirements.txt`.

## Suggested Improvements

- Add `python-dotenv` to `requirements.txt`
- Hash passwords before storing them
- Add an `.env.example` file
- Add backend tests and API validation coverage
- Add a single command or script to run both frontend and backend
