const voiceToTextService = require("../../services/voiceToText.service");
const SummarizeService = require("../../services/summarize.service");
async function summarizeVoiceController(req, res) {
  //send file name only
  const { filename } = req.body;

  if (!filename) {
    return res.status(400).json({ error: "File name is required" });
  }

  try {
    const summarizedText = await voiceToTextService.processVoice(filename);
    console.log("Summarized Text: ", summarizedText);

    res.status(200).json({ summarizedText });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
async function summarizeTextController(req, res) {
  try {
    const { text } = req.body;
    const summary = await SummarizeService.summarizeText(text);
    res.status(200).json({ summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
module.exports = { summarizeVoiceController, summarizeTextController };
