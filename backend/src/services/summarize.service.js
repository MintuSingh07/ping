const Groq = require("groq-sdk");

class SummarizeService {
  constructor() {
    if (!process.env.GROQ_API_KEY) {
      console.error("Missing GROQ_API_KEY");
    }

    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  async summarizeText(text) {
    try {
      const response = await this.groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",

        messages: [
          {
            role: "system",
            content: `
            You are an AI assistant relaying a message directly to the person reading it. Rephrase the given message as a short, clear one-liner — as if you are personally briefing them about what the sender said.

            Rules:
            - Identify the sender's name from the message and use it as the subject. If no name is found, use "Someone".
            - Always address the reader as "you" or "your" — never say "the user" or "their" when referring to the reader.
            - Convert the sender's first-person language to third-person (e.g. "I want" becomes "[Name] wants").
            - When the sender addresses the reader directly (e.g. "you forgot your key"), keep it as "you" and "your" in the output.
            - Preserve key details: names, times, dates, locations, and action items.
            - Keep it to one concise sentence.
            - Output ONLY the rephrased sentence. No quotes, no labels, no extra text.`,
          },
          {
            role: "user",
            content: text,
          },
        ],

        temperature: 0,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error("Summarization Error:", error);

      throw new Error("Failed to summarize text");
    }
  }
}

module.exports = new SummarizeService();
