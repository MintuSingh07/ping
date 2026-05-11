require("dotenv").config();
const voiceToTextService = require("./src/services/voiceToText.service");

async function runTest() {
  console.log(
    "🚀 Starting Full Voice Pipeline Test (Transcription + Translation)...",
  );
  try {
    // Using the same test file you used before
    const summarizedText = await voiceToTextService.processVoice("test.opus");

    console.log("\n✅ Pipeline Successful!");
    console.log("-----------------------------------------");
    console.log("🇬🇧  Summary:", summarizedText);
    console.log("-----------------------------------------");
  } catch (error) {
    console.error("\n❌ Test Failed:", error.message);
  }
}

runTest();
