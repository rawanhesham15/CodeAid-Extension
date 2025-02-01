"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelAPI = void 0;
const generative_ai_1 = require("@google/generative-ai");
class ModelAPI {
    apiKey = "AIzaSyC-bBVVstUGkTLEW_PE5pvs-nSJiOtvuho";
    genAI = new generative_ai_1.GoogleGenerativeAI(this.apiKey);
    model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    async sendPrompt(prompt) {
        try {
            const result = await this.model.generateContent(prompt);
            return result.response.text();
        }
        catch (error) {
            console.error("Model API error:", error);
            return "";
        }
    }
}
exports.ModelAPI = ModelAPI;
//# sourceMappingURL=model_api.js.map