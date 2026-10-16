# AI Interviewer Agent

A full-stack technical interview simulator that creates role-specific questions, follows up on incomplete answers, scores each response, and produces a final performance report.

**Live application:** https://ai-interviewer-agent-brown.vercel.app/

## What it demonstrates

- React interface with a responsive interview workflow
- REST API built with Node.js and Express
- MongoDB persistence through Mongoose
- Gemini-powered question generation and answer evaluation
- Structured AI responses validated before they reach the UI
- Multi-turn follow-up questions with a fixed retry limit
- Production deployment using Vercel, Render, and MongoDB Atlas

## Architecture

```text
React client (Vercel)
        |
        | HTTPS / JSON
        v
Express API (Render)
        |--------------------> Gemini API
        |
        v
MongoDB Atlas
```

The browser never connects directly to MongoDB or Gemini. It sends only the interview role, difficulty, question count, and candidate answers to the API. The server controls database queries and constructs the limited prompts sent to Gemini.

## AI design

Gemini is used for three bounded tasks:

1. Generate one question appropriate for the selected role and difficulty.
2. Evaluate an answer and either request clarification or return structured feedback.
3. Summarize the completed interview.

The prompts request strict JSON, and the server parses and validates the expected fields before saving or returning results. Follow-up questions are capped so the conversation always progresses.

## Privacy and security

- API keys and the MongoDB connection string are stored as deployment secrets, not committed to Git.
- Database access happens only in the backend.
- The AI provider does not receive database credentials or unrestricted database access.
- Prompts contain only the information needed for the current interview.
- Environment files and build output are excluded through `.gitignore`.

For a larger production system, I would also add authentication, per-user authorization, rate limiting, stricter CORS rules, retention controls, and automated secret scanning.

## Run locally

Prerequisites: Node.js and a MongoDB database.

```bash
npm run install:all
```

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Start the backend and frontend in separate terminals:

```bash
npm run dev:server
npm run dev:client
```

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Service health check |
| `POST` | `/api/interviews` | Start an interview |
| `GET` | `/api/interviews/:id` | Retrieve an interview |
| `POST` | `/api/interviews/:id/answer` | Submit and evaluate an answer |
| `POST` | `/api/interviews/:id/ask` | Ask for clarification |

## Future improvements

- User accounts and saved interview history
- Voice input and text-to-speech
- Resume-aware question generation
- Interview analytics across multiple sessions
- Automated tests and continuous integration
- Explicit data deletion and configurable retention
