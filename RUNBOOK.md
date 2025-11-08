



1. **Create and activate a virtual environment**
   ```bash
   cd backend
   python -m venv .venv
   # Windows PowerShell
   .\.venv\Scripts\Activate.ps1

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure PostgreSQL**
   - Ensure PostgreSQL is running.
   - Create a database named `dicebank`.
     ```bash
     createdb dicebank
     ```
   - The default connection string lives in `backend/app/database.py`:
     ```
     postgresql://postgres:postgres@localhost:5432/dicebank
     ```
     Update it (or load from env vars) if your credentials differ.

4. **Start the API server**
   ```bash
   cd backend
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   The first startup auto-creates tables via `create_db_and_tables()`.

