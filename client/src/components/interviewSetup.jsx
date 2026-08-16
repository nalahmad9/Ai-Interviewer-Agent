import {useState} from 'react';

const PRESET_ROLES = [
    {label: "Frontend Developer", icon: "🎨"},
    {label: "Backend Developer", icon: "🖥️"},
    {label: "Full Stack Developer", icon: "🌐"},
    {label: "MERN Developer", icon: "🌿"},
    {label: "React Developer", icon: "⚛️"},
    {label: "Node.js Developer", icon: "🟢"},
    {label: "Python Developer", icon: "🐍"},
    {label: "Java Developer", icon: "☕"},
    {label: "Mobile Developer", icon: "📱"},
    {label: "DevOps Engineer", icon: "🚀"},
    {label: "Data Engineer", icon: "📊"},
    {label: "ML Engineer", icon: "🤖"},
    {label: "QA Engineer", icon: "🧪"},
    {label: "Cloud Engineer", icon: "☁️"}
];

const CUSTOM = "__custom__";

const DIFFICULTIES = [
    {value: "junior", label:"Junior", hint: "Fundamental"},
    {value: "mid", label:"Mid", hint: "Intermediate"},
    {value: "senior", label:"Senior", hint: "Advanced"},
]

const QUESTION_COUNTS = [3,5,7,10];

export default function InterviewSetup({onStart, loading}){
    const [role, setRole] = useState(PRESET_ROLES[0].label);
    const [customMode, setCustomMode] = useState(false);
    const [difficulty, setDifficulty] = useState(DIFFICULTIES[0].value);
    const [maxQuestions, setMaxQuestions] = useState(5);

    function handleSelect(e){
        const value = e.target.value;
        if(value === CUSTOM){
            setCustomMode(true);
            setRole("");
        }
        else{
            setCustomMode(false);
            setRole(value);
        }
    }

    function handleSubmit(e){
        e.preventDefault();
        if(role.trim() === "") return;
        onStart({role: role.trim(), difficulty, maxQuestions});
    }

    return(
        <form className="card setup-card" onSubmit={handleSubmit}>
            <label className="field">
                <span className="field-label">Role</span>
                <select
                    className="field-input"
                    value={customMode ? CUSTOM : role}
                    onChange={handleSelect}
                >
                    {PRESET_ROLES.map((r) => (
                        <option key={r.label} value={r.label}>
                            {r.icon} {r.label}
                        </option>
                    ))}
                    <option value={CUSTOM}>✏️ Custom Role...</option>
                </select>
            </label>

            {customMode && (
                <label className="field">
                    <span className="field-label">Custom Role</span>
                    <input
                        className="field-input"
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="Enter a custom role"
                    />
                </label>
            )}

            <div className="field">
                <span className="field-label">Difficulty</span>
                <div className="field-options">
                    {DIFFICULTIES.map((d) => (
                        <button
                            key={d.value}
                            type="button"
                            className={`field-option${difficulty === d.value ? " field-option-active" : ""}`}
                            onClick={() => setDifficulty(d.value)}
                        >
                            <span>{d.label}</span>
                            <small>{d.hint}</small>
                        </button>
                    ))}
                </div>
            </div>

            <div className="field">
                <span className="field-label">Number of Questions</span>
                <div className="field-options field-options-4">
                    {QUESTION_COUNTS.map((count) => (
                        <button
                            key={count}
                            type="button"
                            className={`field-option${maxQuestions === count ? " field-option-active" : ""}`}
                            onClick={() => setMaxQuestions(count)}
                        >
                            <span>{count}</span>
                        </button>
                    ))}
                </div>
            </div>

            <button className="submit-btn" type="submit" disabled={loading}>
                {loading ? "Starting..." : "Start Interview"}
            </button>
        </form>
    )
}