const {Interview} = require("../models/interview");
const geminiService = require("./geminiService");

const MAX_FOLLOW_UPS = 2;

async function createInterview(role, difficulty, maxQuestions = 5){
    const interview = await Interview.create({
        role,
        difficulty,
        status: "in_progress",
        maxQuestions,
        currentQuestionIndex: 0,
        questions: [],
    })

    const questionText = await geminiService.generateQuestion({
        role,
        difficulty,
        previousQuestions: [],
        questionNumber: 1,
        maxQuestions: interview.maxQuestions
    })

    interview.questions.push({questionNumber: 1, question: questionText});
    interview.currentQuestionIndex = 1;
    await interview.save();

    return {
        interviewId: interview.id,
        status: interview.status,
        questionNumber: 1,
        maxQuestions: interview.maxQuestions,
        question: questionText
    }

}

async function getInterview(interviewId){
    const interview = await Interview.findById(interviewId);

    if(!interview){
        const error = new Error("Interview not found");
        error.status = 404;
        throw error;
    }

    return interview;
}

async function submitAnswer(interviewId, answerText){
    const interview = await Interview.findById(interviewId);

    if(!interview){
        const error = new Error("Interview not found");
        error.status = 404;
        throw error;
    }

    if(interview.status === "completed"){
        const error = new Error("This interview has already been completed");
        error.status = 400;
        throw error;
    }

    const currentIndex = interview.currentQuestionIndex - 1;
    const currentQuestion = interview.questions[currentIndex];

    if(!currentQuestion){
        const error = new Error("No active question found for this interview");
        error.status = 400;
        throw error;
    }

    currentQuestion.dialogue.push({from: "candidate", text: answerText});
    currentQuestion.answer = answerText;

    const canFollowUp = currentQuestion.followUpCount < MAX_FOLLOW_UPS;

    const assessment = await geminiService.assessAnswer({
        role: interview.role,
        difficulty: interview.difficulty,
        question: currentQuestion.question,
        dialogue: currentQuestion.dialogue,
        canFollowUp,
    });

    if(assessment.action === "followup" && canFollowUp){
        currentQuestion.dialogue.push({from: "interviewer", text: assessment.message});
        currentQuestion.followUpCount += 1;
        await interview.save();

        return {
            interviewId: interview.id,
            status: interview.status,
            type: "followup",
            message: assessment.message,
            questionNumber: interview.currentQuestionIndex,
            maxQuestions: interview.maxQuestions,
            completed: false,
        }
    }

    // Finalize this question with a score, either because the AI decided it's complete,
    // or because we've hit MAX_FOLLOW_UPS and must move on regardless.
    const evaluation = {
        score: assessment.score,
        feedback: assessment.feedback,
        strengths: assessment.strengths,
        improvement: assessment.improvement,
    };
    currentQuestion.evaluation = evaluation;

    const isLastQuestion = interview.currentQuestionIndex >= interview.maxQuestions;

    if(!isLastQuestion){
        const previousQuestions = interview.questions.map(q => q.question);
        const nextQuestionNumber = interview.currentQuestionIndex + 1;

        const nextQuestionText = await geminiService.generateQuestion({
            role: interview.role,
            difficulty: interview.difficulty,
            previousQuestions,
            questionNumber: nextQuestionNumber,
            maxQuestions: interview.maxQuestions
        });

        interview.questions.push({questionNumber: nextQuestionNumber, question: nextQuestionText});
        interview.currentQuestionIndex = nextQuestionNumber;

        await interview.save();

        return {
            interviewId: interview.id,
            status: interview.status,
            type: "next_question",
            evaluation,
            questionNumber: nextQuestionNumber,
            maxQuestions: interview.maxQuestions,
            question: nextQuestionText,
            completed: false,
        }
    }

    const finalEvaluation = await geminiService.generateFinalEvaluation({
        role: interview.role,
        difficulty: interview.difficulty,
        questions: interview.questions,
    });

    interview.finalEvaluation = finalEvaluation;
    interview.status = "completed";
    interview.completedAt = new Date();

    await interview.save();

    return {
        interviewId: interview.id,
        status: interview.status,
        type: "completed",
        evaluation,
        completed: true,
        finalEvaluation,
    }
}

async function askAboutQuestion(interviewId, message){
    const interview = await Interview.findById(interviewId);

    if(!interview){
        const error = new Error("Interview not found");
        error.status = 404;
        throw error;
    }

    if(interview.status === "completed"){
        const error = new Error("This interview has already been completed");
        error.status = 400;
        throw error;
    }

    const currentIndex = interview.currentQuestionIndex - 1;
    const currentQuestion = interview.questions[currentIndex];

    if(!currentQuestion){
        const error = new Error("No active question found for this interview");
        error.status = 400;
        throw error;
    }

    currentQuestion.dialogue.push({from: "candidate", text: message});

    const reply = await geminiService.converseAboutQuestion({
        role: interview.role,
        difficulty: interview.difficulty,
        question: currentQuestion.question,
        dialogue: currentQuestion.dialogue,
        candidateMessage: message,
    });

    currentQuestion.dialogue.push({from: "interviewer", text: reply});
    await interview.save();

    return {
        interviewId: interview.id,
        reply,
        questionNumber: interview.currentQuestionIndex,
    }
}

module.exports = {createInterview, getInterview, submitAnswer, askAboutQuestion}