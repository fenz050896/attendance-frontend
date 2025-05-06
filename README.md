# Attendance Frontend

A frontend project for Attendance App

## Requirements
- Python v3.12.10
- Node v20.10.0
- Yarn v1.22.22 or NPM
## Tech Stack
**Dependency Manager:** 
For ui/:
Yarn or NPM

For service/:
pip and venv

**UI:**
- Vite, ReactJS, React MUI, zustand

**Service:**
- Python, Flask, ArcFace (insightface), cryptography, TenSEAL

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

For UI:
- `VITE_SERVICE_URL`


## Installation
Using command line

Enter service/ folder:
```bash
  # create virtual environment
  python -m venv ./.venv

  # activate virtual environment
  . ./.venv/bin/activate

  # install from requirements.txt
  pip install -r requirements.txt

```

Open new terminal/command line:
Enter ui/ folder:
```bash
  # use yarn
  yarn install (wait process to finish)
  yarn build (wait process to finish)
  yarn postbuild

  # use npm
  npm install (wait process to finish)
  npm run build (wait process to finish)
  npm run postbuild
```
    
## Run the Project
Enter service/ folder:
```bash
  python flask_server.py
```

by default it run on port 5000
