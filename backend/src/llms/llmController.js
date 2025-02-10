import ModelManager from "./modelManager.js";
import DeepSeekHandler from "./deepseekHandler.js";
import GeminiHandler from "./geminiHandler.js";

class LLMController {
  constructor() {
    this.modelManager = new ModelManager();
    // this.modelManager.addModel(new DeepSeekHandler());
    this.modelManager.addModel(new GeminiHandler());
  }
  async generateResponse(prompt) {
    try {
      return await this.modelManager.sendRequest(prompt);
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
export default LLMController;
