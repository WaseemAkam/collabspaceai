const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const axios = require("axios");

// ── Retry helper ──
async function generateWithRetry(prompt, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "openai/gpt-3.5-turbo", // ✅ safe working model
          messages: [
            { role: "user", content: prompt }
          ]
        },
        {
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5000", // REQUIRED
            "X-Title": "CollabSpace App" // REQUIRED
          }
        }
      );

      return response.data.choices[0].message.content;

    } catch (err) {
      console.log("FULL ERROR:", err.response?.data || err.message);

      if (err.response && err.response.status === 429 && i < retries - 1) {
        const wait = (i + 1) * 3000;
        console.log(`Rate limited. Retrying in ${wait / 1000}s...`);
        await new Promise(r => setTimeout(r, wait));
      } else {
        throw err;
      }
    }
  }
}

// ── 1. AI Task Generator ──
router.post('/generate-tasks', protect, async (req, res) => {
  try {
    const { projectName, projectDescription } = req.body;

    const prompt = `You are a project management expert. Generate a list of 12 realistic tasks for this project:

Project Name: ${projectName}
Description: ${projectDescription}

Return ONLY a valid JSON array, no markdown, no explanation. Format:
[
  {
    "title": "task title",
    "description": "brief description",
    "priority": "high" | "medium" | "low",
    "deadline": "YYYY-MM-DD"
  }
]

Make deadlines realistic starting from today ${new Date().toISOString().split('T')[0]} spread over 4 weeks. Mix priorities realistically.`;

    const text = await generateWithRetry(prompt);

    const clean = text.replace(/```json|```/g, '').trim();

    let tasks = [];
    try {
      tasks = JSON.parse(clean);
    } catch (e) {
      console.error("JSON PARSE ERROR:", clean);
      return res.status(500).json({ message: "Invalid AI JSON format" });
    }

    res.json({ tasks });

  } catch (err) {
    console.error('AI GENERATE ERROR:', err.message);
    res.status(500).json({ message: 'AI generation failed: ' + err.message });
  }
});

// ── 2. AI Progress Summarizer ──
router.post('/summarize', protect, async (req, res) => {
  try {
    const { projectName, tasks, memberCount } = req.body;

    const todo         = tasks.filter(t => t.status === 'todo').length;
    const inprogress   = tasks.filter(t => t.status === 'inprogress').length;
    const done         = tasks.filter(t => t.status === 'done').length;
    const overdue      = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'done').length;
    const highPriority = tasks.filter(t => t.priority === 'high' && t.status !== 'done').length;

    const prompt = `You are a senior project manager. Write a professional project status report.

Project: ${projectName}
Team Size: ${memberCount} members
Total Tasks: ${tasks.length}
Completed: ${done}
In Progress: ${inprogress}
To Do: ${todo}
Overdue: ${overdue}
High Priority Pending: ${highPriority}
Completion Rate: ${Math.round((done / tasks.length) * 100)}%

Write a 4-paragraph professional report covering:
1. Overall project health and progress
2. Current status and what's being worked on
3. Risks and concerns (overdue, high priority items)
4. Recommended next steps for the team

Be specific, professional, and actionable. Use the actual numbers.`;

    const text = await generateWithRetry(prompt);

    res.json({ summary: text });

  } catch (err) {
    console.error('AI SUMMARY ERROR:', err.message);
    res.status(500).json({ message: 'AI summary failed: ' + err.message });
  }
});

// ── 3. AI Smart Assistant ──
router.post('/assistant', protect, async (req, res) => {
  try {
    const { message, context } = req.body;

    const prompt = `You are CollabSpace AI, a smart project management assistant built into a collaboration tool.

Current Project Context:
- Project: ${context.projectName}
- Total Tasks: ${context.totalTasks}
- Completed: ${context.done}
- In Progress: ${context.inProgress}
- Todo: ${context.todo}
- Team Members: ${context.memberCount}
- Overdue Tasks: ${context.overdue}

User's question: ${message}

Reply helpfully and concisely. If suggesting tasks or priorities, be specific. Keep response under 150 words. Be friendly but professional.`;

    const text = await generateWithRetry(prompt);

    return res.json({ reply: text });

  } catch (err) {
    console.error('AI ASSISTANT ERROR:', err.message);
    return res.status(500).json({ message: 'Assistant failed: ' + err.message });
  }
});

module.exports = router;