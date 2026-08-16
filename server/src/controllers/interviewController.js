const interviewService = require('../services/interviewService');

async function createInterview(req, res, next) {
    try {
        const { role, difficulty, maxQuestions } = req.body;
        if (!role || role.trim() === '') {
            return res.status(400).json({ error: 'Role is required' });
        }
        const requested = Number(maxQuestions) || 5;

        const result = await interviewService.createInterview(
            role.trim(),
            (difficulty || "junior").trim(),
            requested
        );

        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

async function getInterview(req, res, next) {
    try {
        const { id } = req.params;
        const interview = await interviewService.getInterview(id);
        res.status(200).json(interview);
    } catch (error) {
        next(error);
    }
}

async function submitAnswer(req, res, next) {
    try {
        const { id } = req.params;
        const { answer } = req.body;

        if(!answer || answer.trim() === ''){
            return res.status(400).json({ error: 'Answer is required' });
        }

        const result = await interviewService.submitAnswer(id, answer.trim());
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

async function askAboutQuestion(req, res, next) {
    try {
        const { id } = req.params;
        const { message } = req.body;

        if(!message || message.trim() === ''){
            return res.status(400).json({ error: 'Message is required' });
        }

        const result = await interviewService.askAboutQuestion(id, message.trim());
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

module.exports = { createInterview, getInterview, submitAnswer, askAboutQuestion };