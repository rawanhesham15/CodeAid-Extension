const axios = require("axios");
const ILLM = require("./ILLM");
const { GoogleGenerativeAI } = require("@google/generative-ai");

class GemeniHandler extends ILLM {
  async processPrompt(prompt) {
    const genAI = new GoogleGenerativeAI("AIzaSyC-bBVVstUGkTLEW_PE5pvs-nSJiOtvuho");
	const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    try {
		const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
      console.error("Gemeni failed:", error.message);
      throw new Error("Gemeni failed");
    }
  }
}

export default GemeniHandler;