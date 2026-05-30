# 🚀 ResumeAI — AI-Powered Resume Analyzer

ResumeAI is a full-stack web application that analyzes resumes against job descriptions using AI. It provides ATS-style scoring, skill gap analysis, resume improvement suggestions, personalized learning roadmaps, and AI-generated cover letters.

---

## ✨ Features

- **Semantic ATS Scoring** — AI understands meaning, not just keywords

- **Skill Gap Analysis** — See exactly what's missing for the role

- **AI Rewrite Suggestions** — Weak bullet points rewritten by AI

- **Personalized Learning Roadmap** — 4-week study plan with free resources

- **Cover Letter Generator** — Tailored cover letter in one click

---

## 🛠️ Tech Stack

| Layer       | Technology                      |
| ----------- | ------------------------------- |
| Frontend    | React 18, Vite, Axios           |
| Backend     | Django 5, Django REST Framework |
| AI Engine   | Groq API (LLaMA 3.3 70B)        |
| PDF Parsing | PyMuPDF (fitz)                  |
| Styling     | CSS                             |

---

## 📁 Project Structure

```text
resume-analyzer/
├── backend/
│   ├── analyzer/
│   ├── core/
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   └── src/
│       ├── App.jsx
│       └── index.css
│
└── README.md
```

---

## 🚀 Run Locally

### Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver
```

Backend runs at:

```text
http://127.0.0.1:8000
```

### Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

---

## ⚙️ Environment Variables

Create a `.env` file inside the `backend/` folder:

```env
GROQ_API_KEY=your-groq-api-key
```

---

## 🔌 API Endpoints

| Method | Endpoint                 | Description                    |
| ------ | ------------------------ | ------------------------------ |
| POST   | `/api/analyze-resume/`   | ATS scoring and skill analysis |
| POST   | `/api/ai-suggestions/`   | Resume improvement suggestions |
| POST   | `/api/learning-roadmap/` | Personalized roadmap           |
| POST   | `/api/cover-letter/`     | AI-generated cover letter      |

---

## 💡 How It Works

1. User uploads a resume PDF and enters a job description.
2. PyMuPDF extracts text from the resume.
3. Groq LLaMA 3.3 70B performs semantic analysis.
4. The system generates:

   * ATS Score
   * Matched Skills
   * Missing Skills
   * AI Suggestions
   * Learning Roadmap
   * Cover Letter

---

## 👩‍💻 Author

**Jyotsna R Bhat**
B.Tech Artificial Intelligence & Data Science
