const BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/interviews`
  : "https://tech-backend-api.tech-backend-nada.workers.dev/api/interviews";

async function handleResponse(response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
    }
    return data;
}

export async function createInterview({ role, difficulty, maxQuestions }) {
    const response = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, difficulty, maxQuestions }),
    });
    return handleResponse(response);
}

export async function submitAnswer(interviewId, answer) {
    const response = await fetch(`${BASE_URL}/${interviewId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
    });
    return handleResponse(response);
}

export async function getInterview(interviewId) {
    const response = await fetch(`${BASE_URL}/${interviewId}`);
    return handleResponse(response);
}