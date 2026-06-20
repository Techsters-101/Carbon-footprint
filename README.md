# 🌱 Carbonly

**A carbon footprint calculator actually built for how we live in India.**

Hey there! Welcome to Carbonly. I built this project for **Challenge 3 of the Hack2Skill PromptWars**.

If you've ever tried a standard online carbon footprint calculator while living in India, you've probably noticed they feel a bit... off. They usually assume you drive a gas-guzzling car everywhere, heat a massive house with a furnace, and eat a Western diet. 

I wanted to build something that actually reflects reality here. Carbonly recalculates your footprint using localized Indian data (think Metro rides, KSRTC buses, dal/paneer diets, and CEA grid metrics) to give you a much more accurate picture of your environmental impact.

---

##  What makes it different?

* **India-First Math:** The backend doesn't use generic global averages. It calculates emissions using data from the MoEFCC, Indian Railways, and the CEA.
* **Live AI Advisor:** Instead of just giving you a boring number and generic advice like "turn off your lights," Carbonly feeds your specific scores to an LLM. It generates hyper-personalized, actionable tips in milliseconds (e.g., suggesting the *PM Surya Ghar Yojana* if your electricity score is high).
* **Blazing Fast & Resilient:** Uses an optimized asynchronous Python backend with an LRU cache so we don't spam the AI API if users have similar scores. It also has a hardcoded fallback just in case the AI goes down.
* **Accessible Design:** Screen-reader friendly with semantic ARIA tags built into the UI.

---

## The Tech Stack

I built this over a hackathon weekend. Here is what's running under the hood:

**Frontend (Deployed on Vercel):**
* React + Vite
* TailwindCSS v4 (The brand new engine!)
* Recharts (For those beautiful dark-mode graphs)

**Backend (Deployed on Render):**
* Python + FastAPI (Async)
* SQLite (For lightweight submission tracking)
* Pytest (For automated endpoint testing)
* Groq API (Running `Llama-3-8b` for lightning-fast AI inference)

---

## Run it locally

Want to spin this up on your own machine? It's pretty straightforward.

### 1. Clone the repo
```bash
git clone https://github.com/Techsters-101/Carbon-footprint.git
cd carbon-footprint
```
### 2. Start the Backend

You will need a free Groq API key for the AI to work.
```bash

cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt

# Export your API key
export GROQ_API_KEY="gsk_your_api_key_here"
uvicorn main:app --reload
```
The API will start on http://localhost:8000

### 3. Start the Frontend

Open a new terminal window:
```bash

cd frontend
npm install
npm run dev
```
The app will start on http://localhost:5173
### Testing

We wrote a test suite for the backend to ensure the math and API structure don't break when making updates. To run the tests, open your backend terminal and run:
```bash

pytest
```
If you find a bug, have an idea for a better emission formula, or just want to tell us our code is messy—feel free to open an issue or submit a PR!

Live Demo: https://carbon-footprint-bice.vercel.app/

Built with caffeine and curiosity for Hack2Skill.
### Peace out junta !!!
