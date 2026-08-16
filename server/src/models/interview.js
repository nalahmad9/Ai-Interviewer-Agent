const mongoose = require('mongoose');

// Agent Evaluation Schema

const agentEvaluationSchema = new mongoose.Schema({

    score: {
        type: Number,
        required: true,
    },
    feedback: {
        type: String,
        required: true,
    },
    strengths: {
        type: [String], // fixed: lowercase `string` isn't a valid Mongoose type
        default: [],
    },
    improvement: {
        type: [String], // fixed: lowercase `string` isn't a valid Mongoose type
        default: [],
    }
},
{_id: false}
)

// Turn Schema (it exchange the turn between the interviewer and the candidate)

const turnSchema = new mongoose.Schema({

    from: {
        type: String,
        enum: ['interviewer', 'candidate'],
        required: true,
    },
    text: {
        type: String,
        required: true,
    }
},
{_id: false}
)

// Question Schema

const questionSchema = new mongoose.Schema({
    questionNumber: {
        type: Number,
        required: true,
    },
    question: {
        type: String,
        required: true,
    },
    dialogue: {
        type: [turnSchema],
        default: [],
    },
    followUpCount: {
        type: Number,
        default: 0,
    },
    answer: { type: String, default: "" },
    evaluation: {
        type: agentEvaluationSchema, // fixed: `evaluationSchema` was never defined, this now points to the real schema
        default: null,
    }
},
{_id: false}
)

//Final Evaluation Schema

const finalEvaluationSchema = new mongoose.Schema({
    averageScore: {
        type: Number,
        required: true,
    },
    summary: { // fixed: was "sumamry" (typo)
        type: String,
        required: true,
    },
    strengths: {
        type: [String], // fixed: lowercase `string` isn't a valid Mongoose type
        default: [],
    },
    improvement: {
        type: [String], // fixed: lowercase `string` isn't a valid Mongoose type
        default: [],
    }
},
{_id: false}
)

const interviewSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true,
    },
    difficulty: {
        type: String,
        required: true,
        enum: ['junior', 'mid', 'senior'],
    },
    status: {
        type: String,
        enum: ['created', 'in_progress', 'completed'],
        default: 'created',
    },
    maxQuestions: {
        type: Number,
        default: 5,
    },
    currentQuestionIndex: {
        type: Number,
        default: 0,
    },
    questions: {
        type: [questionSchema],
        default: [],
    },
    finalEvaluation: {
        type: finalEvaluationSchema,
        default: null,
    },
    completedAt: {
        type: Date,
        default: null,
    }
}, { timestamps: true })

const Interview = mongoose.model('Interview', interviewSchema);

module.exports = {Interview};