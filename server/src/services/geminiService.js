const { GoogleGenAI } = require("@google/genai");
const { env } = require("../config/env");

const ai = new GoogleGenAI({
    apiKey: env.gemini.apiKey
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGemini(prompt, { maxTokens = 1024, retries = 2 } = {}) {
    const { model } = env.gemini;

    if (!env.gemini.apiKey || !model) {
        throw new Error("Gemini API is not configured. Please provide GEMINI_API_KEY and GEMINI_MODEL in your .env");
    }

    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: model,
                contents: prompt,
                config: {
                    temperature: 0.7,
                    maxOutputTokens: maxTokens,
                    thinkingConfig: {
                        thinkingLevel: "low"
                    }
                }
            });

            const text = response?.text;

            if (typeof text !== "string" || text.trim() === "") {
                console.log("Full Gemini response for debugging:", JSON.stringify(response, null, 2));
                throw new Error("Gemini API returned an empty response");
            }

            return text;
        } catch (error) {
            lastError = error;
            const errorMessage = error.message || "";
            const isRateLimitOrUnavailable = errorMessage.includes("503") || errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED");

            if (isRateLimitOrUnavailable && attempt < retries) {
                console.log(`Gemini encountered a temporary issue, retrying (attempt ${attempt + 1}/${retries})...`, errorMessage.slice(0, 150));
                await sleep(1000 * (attempt + 1));
                continue;
            }

            throw new Error(`Error calling Gemini API: ${errorMessage}`);
        }
    }

    throw lastError;
}

function extractJson(text) {
    let cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

    if (!cleaned.startsWith("{")) {
        const start = cleaned.indexOf("{");
        const end = cleaned.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
            cleaned = cleaned.slice(start, end + 1);
        }
    }

    try {
        return JSON.parse(cleaned);
    } catch (error) {
        throw new Error("AI returned invalid JSON: " + text.slice(0, 200));
    }
}

async function generateQuestion({
    role,
    difficulty,
    previousQuestions = [],
    questionNumber,
    maxQuestions,
}) {
    console.log(`Gemini generating question ${questionNumber}`);
    const previousList = previousQuestions.length > 0 ? previousQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n") : ("none yet");
    const prompt = `You are conducting a technical interview. Speak directly to the candidate using "you".
    Candidate role: ${role}
    Difficulty: ${difficulty},
    Current question: ${questionNumber} of ${maxQuestions},
    Previously Asked Question: ${previousList}
    
    Generate ONE new technical interview question.
    The question should:
      - Match the candidate's level
      - Be concise (one sentence, under 25 words)
      - Test understanding rather than trivia
      - Don't repeat any previous questions
    
    Respond with ONLY this exact JSON, nothing else, no markdown fences: {"question": "your question here"}`;

    const text = await callGemini(prompt, { maxTokens: 800 });
    const result = extractJson(text);

    if (typeof result.question !== "string" || result.question.trim() === "") {
        throw new Error("Invalid AI question response");
    }

    console.log("Question received");
    return result.question.trim();
}

async function assessAnswer({
    role,
    difficulty,
    question,
    dialogue,
    canFollowUp,
}) {
    console.log("Gemini assessing answer");

    const transcript = dialogue.map(turn =>
        `${turn.from === "interviewer" ? "Interviewer" : "Candidate"}: ${turn.text}`
    ).join("\n");

    const followUpInstruction = canFollowUp
        ? `If your latest answer is incomplete, vague, incorrect, or off-topic, you may ask ONE short, specific follow-up question that pushes you to clarify or correct your answer, digging deeper into the same concept — like a real interviewer would. Otherwise, if the answer is solid enough, finalize with a score.`
        : `You have now had 3 attempts at this question. You must finalize it now with a score, even if your answer is still incorrect or incomplete. If your answer was wrong or incomplete, your "feedback" must clearly state the correct answer or the key concept you missed, so you learn it before moving on.`;

    const prompt = `You are conducting a live technical interview for a ${role} (${difficulty}) role. Speak directly to the candidate using "you" (e.g., "Your answer...", "You missed...").

    Original question: ${question}

    Conversation so far:
    ${transcript}

    ${followUpInstruction}

    Respond with ONLY this exact JSON, nothing else, no markdown fences:
    {
      "action": "followup" or "complete",
      "message": "<if action is followup: a short, specific follow-up question or pushback directed at you using 'you', under 30 words. If action is complete, use an empty string.>",
      "score": <if action is complete: a number from 0 to 10. If action is followup, use null.>,
      "feedback": "<if action is complete: one or two sentences of direct feedback speaking directly to you using 'you'. If action is followup, use an empty string.>",
      "strengths": [<if action is complete: short strengths as strings addressing you. If action is followup, use an empty array.>],
      "improvement": [<if action is complete: short improvement points as strings addressing you. If action is followup, use an empty array.>]
    }`;

    const text = await callGemini(prompt, { maxTokens: 800 });
    const result = extractJson(text);

    if (result.action !== "followup" && result.action !== "complete") {
        throw new Error("Invalid AI assessment response: missing or invalid action");
    }

    if (result.action === "followup" && (typeof result.message !== "string" || result.message.trim() === "")) {
        throw new Error("Invalid AI assessment response: missing follow-up message");
    }

    if (result.action === "complete" && typeof result.score !== "number") {
        throw new Error("Invalid AI assessment response: missing score");
    }

    console.log(`Assessment received: ${result.action}`);
    return {
        action: result.action,
        message: result.message || "",
        score: result.score,
        feedback: result.feedback || "",
        strengths: Array.isArray(result.strengths) ? result.strengths : [],
        improvement: Array.isArray(result.improvement) ? result.improvement : [],
    };
}

async function converseAboutQuestion({
    role,
    difficulty,
    question,
    dialogue,
    candidateMessage,
}) {
    console.log("Gemini responding to candidate question");

    const transcript = dialogue.map(turn =>
        `${turn.from === "interviewer" ? "Interviewer" : "Candidate"}: ${turn.text}`
    ).join("\n");

    const prompt = `You are a friendly technical interviewer for a ${role} (${difficulty}) role, currently mid-question. Speak directly to the candidate using "you".

    The question you asked: ${question}

    Conversation so far:
    ${transcript}

    You are now asking me something (a clarifying question, asking for a hint, or just chatting) rather than answering yet: "${candidateMessage}"

    Reply naturally and briefly (under 40 words) addressing the candidate directly using "you", the way a real interviewer would. You can clarify the question or give a small nudge, but don't give away the full answer. Do not score or evaluate anything in this reply — you're just having a conversation.

    Respond with ONLY this exact JSON, nothing else, no markdown fences:
    {"reply": "your reply here"}`;

    const text = await callGemini(prompt, { maxTokens: 400 });
    const result = extractJson(text);

    if (typeof result.reply !== "string" || result.reply.trim() === "") {
        throw new Error("Invalid AI conversation response");
    }

    console.log("Conversation reply received");
    return result.reply.trim();
}

async function generateFinalEvaluation({
    role,
    difficulty,
    questions,
}) {
    console.log("Gemini generating final evaluation");

    const scoredQuestions = questions.filter(q => q.evaluation && typeof q.evaluation.score === "number");
    const averageScore = scoredQuestions.length > 0
        ? Number((scoredQuestions.reduce((sum, q) => sum + q.evaluation.score, 0) / scoredQuestions.length).toFixed(1))
        : 0;

    const questionSummaries = questions.map((q, i) =>
        `${i + 1}. Q: ${q.question}\n   A: ${q.answer || "(no answer given)"}\n   Score: ${q.evaluation?.score ?? "N/A"}`
    ).join("\n\n");

    const prompt = `You are writing a final performance summary for a candidate who just completed a technical interview.
    Candidate role: ${role}
    Difficulty: ${difficulty}
    Average score across all questions: ${averageScore}

    Full interview record:
    ${questionSummaries}

    Write a direct, encouraging final evaluation speaking *directly* to the candidate using "you" (e.g. "You demonstrated...", "Your strengths include..."). Never refer to them in the third person like "the candidate".
    
    Respond with ONLY this exact JSON, nothing else, no markdown fences:
    {
      "summary": "<2-3 sentence overall summary addressing the candidate directly using 'you'>",
      "strengths": ["<short strength>", "<short strength>"],
      "improvement": ["<short area to improve>", "<short area to improve>"]
    }`;

    const text = await callGemini(prompt, { maxTokens: 800 });
    const result = extractJson(text);

    if (typeof result.summary !== "string") {
        throw new Error("Invalid AI final evaluation response");
    }

    console.log("Final evaluation received");
    return {
        averageScore,
        summary: result.summary,
        strengths: Array.isArray(result.strengths) ? result.strengths : [],
        improvement: Array.isArray(result.improvement) ? result.improvement : [],
    };
}

module.exports = { generateQuestion, assessAnswer, converseAboutQuestion, generateFinalEvaluation };