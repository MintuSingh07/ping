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
                You are an AI assistant. 
                
                Summarize the transcript clearly. 
                
                Keep it concise.
              `,
          },
          {
            role: "user",
            content: text,
          },
        ],

        temperature: 0.3,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error("Summarization Error:", error);

      throw new Error("Failed to summarize text");
    }
  }
}

module.exports = new SummarizeService();
