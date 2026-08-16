import { useState, useRef, useEffect } from 'react';
import InterviewSetup from './components/interviewSetup';
import { createInterview, submitAnswer } from './services/interviewApi';
import './styles/setup.css';
import './styles/chat.css';

const FEATURES = [
    {
        icon: "💬",
        title: "Conversational",
        desc: "Answer in your own words — the interviewer reacts to what you actually say."
    },
    {
        icon: "⚡",
        title: "Instant feedback",
        desc: "Every answer scored 0–10 with strengths and specific fixes."
    },
    {
        icon: "📊",
        title: "Final report",
        desc: "An overall score and summary of your performance at the end."
    },
];

export default function App() {
    const [stage, setStage] = useState("setup"); // "setup" | "interview" | "results"
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [interviewId, setInterviewId] = useState(null);
    const [role, setRole] = useState("");
    const [difficulty, setDifficulty] = useState("");
    const [questionNumber, setQuestionNumber] = useState(0);
    const [maxQuestions, setMaxQuestions] = useState(0);
    const [answerText, setAnswerText] = useState("");
    const [messages, setMessages] = useState([]); 
    const [finalEvaluation, setFinalEvaluation] = useState(null);

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [answerText]);

    // Handle browser back button behavior based on the current stage
    useEffect(() => {
        const handlePopState = () => {
            // If the user hits the browser back button while in interview/results, reset to setup
            setStage("setup");
            setInterviewId(null);
            setRole("");
            setDifficulty("");
            setQuestionNumber(0);
            setMaxQuestions(0);
            setAnswerText("");
            setMessages([]);
            setFinalEvaluation(null);
            setError(null);
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    async function handleStart(setupData) {
        setLoading(true);
        setError(null);
        try {
            const result = await createInterview(setupData);
            setInterviewId(result.interviewId);
            setRole(setupData.role);
            setDifficulty(setupData.difficulty);
            setQuestionNumber(result.questionNumber);
            setMaxQuestions(result.maxQuestions);
            setMessages([
                {
                    role: "ai",
                    text: `Hi! I'll be your interviewer today for the ${setupData.role} (${setupData.difficulty}) role. We'll go through ${result.maxQuestions} short questions. Take your time — let's begin.`
                },
                {
                    role: "ai",
                    isQuestion: true,
                    questionNumber: result.questionNumber,
                    text: result.question
                }
            ]);
            
            // Push a new history state when entering the interview so the back button can catch it
            window.history.pushState({ stage: "interview" }, "", window.location.href);
            setStage("interview");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmitAnswer(e) {
        e.preventDefault();
        const trimmed = answerText.trim();
        if (trimmed === "" || loading) return;

        setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
        setAnswerText("");
        setLoading(true);
        setError(null);

        try {
            const result = await submitAnswer(interviewId, trimmed);

            if (result.type === "followup") {
                setMessages((prev) => [...prev, { role: "ai", text: result.message }]);
            } else if (result.type === "next_question") {
                setMessages((prev) => [
                    ...prev,
                    { role: "ai", text: result.evaluation.feedback },
                    {
                        role: "ai",
                        isQuestion: true,
                        questionNumber: result.questionNumber,
                        text: result.question
                    }
                ]);
                setQuestionNumber(result.questionNumber);
            } else if (result.type === "completed") {
                setMessages((prev) => [...prev, { role: "ai", text: result.evaluation.feedback }]);
                setFinalEvaluation(result.finalEvaluation);
                window.history.pushState({ stage: "results" }, "", window.location.href);
                setStage("results");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function handleRestart() {
        setStage("setup");
        setInterviewId(null);
        setRole("");
        setDifficulty("");
        setQuestionNumber(0);
        setMaxQuestions(0);
        setAnswerText("");
        setMessages([]);
        setFinalEvaluation(null);
        setError(null);
    }

    function handleTextareaKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmitAnswer(e);
        }
    }

    const progressPercent = maxQuestions > 0 ? Math.round((questionNumber / maxQuestions) * 100) : 0;

    return (
        <div className="app-shell">
            {stage === "setup" && (
                <div className="app-grid">
                    <div className="hero">
                        <div className="hero-badge">
                            <span className="hero-badge-dot" />
                            Powered by Gemini
                        </div>
                        <h1 className="hero-title">Practice your next tech interview</h1>
                        <p className="hero-subtitle">
                            A short, conversational technical interview. Pick a role, and your AI interviewer will ask questions, react to your answers, and give you honest feedback — one message at a time.
                        </p>
                        <div className="hero-features">
                            {FEATURES.map((f) => (
                                <div className="hero-feature" key={f.title}>
                                    <div className="hero-feature-icon">{f.icon}</div>
                                    <div>
                                        <div className="hero-feature-title">{f.title}</div>
                                        <div className="hero-feature-desc">{f.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <InterviewSetup onStart={handleStart} loading={loading} />
                        {error && <p className="error-text">{error}</p>}
                    </div>
                </div>
            )}

            {stage === "interview" && (
                <div className="chat-shell">
                    <div className="chat-header">
                        <div>
                            <div className="chat-title">AI Interview Simulator</div>
                            <div className="chat-subtitle">{role} · {difficulty}</div>
                        </div>
                        <div className="chat-progress">
                            <span className="chat-progress-text">{questionNumber}/{maxQuestions}</span>
                            <div className="chat-progress-track">
                                <div className="chat-progress-fill" style={{ width: `${progressPercent}%` }} />
                            </div>
                        </div>
                    </div>

                    <div className="chat-messages">
                        {messages.map((msg, i) => (
                            <div className={`chat-row ${msg.role}`} key={i}>
                                <div className="chat-avatar">{msg.role === "ai" ? "AI" : "You"}</div>
                                <div className="chat-bubble">
                                    {msg.isQuestion && (
                                        <div className="chat-question-label">Question {msg.questionNumber}</div>
                                    )}
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {error && <p className="error-text">{error}</p>}

                    <form className="chat-input-bar" onSubmit={handleSubmitAnswer}>
                        <textarea
                            ref={textareaRef}
                            className="field-input chat-input"
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            onKeyDown={handleTextareaKeyDown}
                            placeholder="Type your answer..."
                            rows={1}
                            disabled={loading}
                        />
                        <button className="chat-send-btn" type="submit" disabled={loading || answerText.trim() === ""}>
                            ↑
                        </button>
                    </form>
                </div>
            )}

            {stage === "results" && finalEvaluation && (
                <div className="card results-card">
                    <div className="results-score">{finalEvaluation.averageScore}/10</div>
                    <p className="results-summary">{finalEvaluation.summary}</p>

                    <div className="results-columns">
                        <div>
                            <span className="field-label">Strengths</span>
                            <ul>
                                {finalEvaluation.strengths.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                        <div>
                            <span className="field-label">Areas to improve</span>
                            <ul>
                                {finalEvaluation.improvement.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                    </div>

                    <button className="submit-btn" onClick={handleRestart}>
                        Start Another Interview
                    </button>
                </div>
            )}
        </div>
    );
}