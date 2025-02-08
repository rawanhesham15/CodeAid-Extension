const axios = require("axios");
const ILLM = require("./ILLM");

class DeepSeekHandler extends ILLM {
  async processPrompt(prompt) {
    try {
      const response = await axios.post("https://deepseek-api.com/generate", {
        prompt: prompt,
      });
      return response.data;
    } catch (error) {
      console.error("DeepSeek failed:", error.message);
      throw new Error("DeepSeek failed");
    }
  }
}

export default deepseekHandler;