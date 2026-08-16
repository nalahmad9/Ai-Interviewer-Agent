const { Router } = require('express');
const { createInterview, getInterview, submitAnswer, askAboutQuestion } = require("../controllers/interviewController");

const router = Router();

router.post("/", createInterview);
router.get("/:id", getInterview);
router.post("/:id/answer", submitAnswer);
router.post("/:id/ask", askAboutQuestion);

module.exports = router;