const Groq = require("groq-sdk");
const fs = require("fs");
const path = require("path");
const summarizeService = require("./summarize.service");

class VoiceToTextService {
  constructor() {
    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is missing");
    }

    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    this.uploadsDir = path.join(__dirname, "../../uploads");
  }

  async transcribeAudio(fileName) {
    const filePath = path.join(this.uploadsDir, fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${fileName}`);
    }

    try {
      const transcription = await this.groq.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: "whisper-large-v3-turbo",
        response_format: "json",
      });

      return transcription.text;
    } catch (error) {
      console.error("Transcription Error:", error);
      throw new Error("Failed to transcribe audio");
    }
  }

  async translateText(text) {
    try {
      const response = await this.groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are a professional translator. Translate the following text into clear, natural English. Only return the translated text, nothing else.",
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
      console.error("Text Translation Error:", error);
      throw new Error("Failed to translate text");
    }
  }

  async processVoice(fileName) {
    // Step 1: Get original transcription
    const originalText = await this.transcribeAudio(fileName);

    // Step 2: Translate that text into English
    const translatedText = await this.translateText(originalText);

    // Step 3: Summarize the translated text
    const summary = await summarizeService.summarizeText(translatedText);

    return summary;
  }
}

module.exports = new VoiceToTextService();
