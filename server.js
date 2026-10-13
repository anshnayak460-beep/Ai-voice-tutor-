const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: [
    "https://anshnayak460-beep.github.io"
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json({ limit: "20kb" }));

app.get("/", (req, res) => {
  res.send("AI Voice Tutor backend is running.");
});

app.post("/api/ask", async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Server par Groq API key set nahi hai."
      });
    }

    const { question, subject, language } = req.body;

    if (
      typeof question !== "string" ||
      !question.trim() ||
      question.length > 4000
    ) {
      return res.status(400).json({
        error: "Sahi sawal bhejo. Sawal 4000 characters se chhota hona chahiye."
      });
    }

    const allowedLanguages = ["Hindi", "English", "Hinglish"];

    const safeLanguage = allowedLanguages.includes(language)
      ? language
      : "Hindi";

    const allowedSubjects = [
      "General Learning",
      "Class 10 Maths",
      "Science",
      "English",
      "General Knowledge",
      "NDA Preparation"
    ];

    const safeSubject = allowedSubjects.includes(subject)
      ? subject
      : "General Learning";

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                `You are a friendly educational voice tutor.
                 Subject: ${safeSubject}.
                 Reply in ${safeLanguage}.
                 Explain concepts clearly for a school student.
                 Keep answers concise and easy to speak aloud.
                 For maths, show the important calculation steps.
                 If you are unsure of a fact, say so.
                 Do not claim to know information you do not know.`
            },
            {
              role: "user",
              content: question.trim()
            }
          ],
          temperature: 0.5,
          max_tokens: 700
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API error:", data);

      return res.status(502).json({
        error: "AI se jawab nahi mil saka. API key, model aur quota check karo."
      });
    }

    const answer =
      data.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return res.status(502).json({
        error: "AI ne koi jawab nahi diya."
      });
    }

    res.json({ answer });

  } catch (error) {
    console.error("Server error:", error.message);

    res.status(500).json({
      error: "Server mein dikkat hai. Thodi der baad try karo."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`AI Voice Tutor server running on port ${PORT}`);
});
