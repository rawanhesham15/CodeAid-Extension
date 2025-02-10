import axios from "axios";
import ILLM from "./ILLM.js";

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

export default DeepSeekHandler;