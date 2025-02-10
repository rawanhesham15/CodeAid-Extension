import LLMController from "../llms/llmController.js";
import FileManager from "./../fileManager/fileManager.js";

class DetectionAction {
  constructor() {
    this.llmController = new LLMController();
    this.fileManager = new FileManager();
    if (new.target === DetectionAction) {
      throw new Error("Can't instantiate an abstract class directly");
    }
  }
  /**
   *
   * @param {Object} req
   * @returns {string}
   */
  async detectionMethod(req) {
    var codeJSON = this.gatherCode(req.body.path);
    var summarizedCode = this.summarize(req.body.path);
    var prompt = this.generatePrompt(codeJSON, summarizedCode);
    var response = await this.processPrompt(prompt);
    return this.formatLLMResponse(response);
  }
  gatherCode(path) {
    return this.fileManager.gatherCode(path);
  }
  summarize(path) {
    return "";
  }
  generatePrompt(codeJSON, summary) {}
  async processPrompt(prompt) {
    return this.llmController.generateResponse(prompt);
  }
  saveViolations(violations, prjctID) {
    return "";
  }
  formatLLMResponse(response) {
    response = response.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
    response = response.replace(/\*(.*?)\*/g, "<i>$1</i>");
    response = response.replace(/`(.*?)`/g, "<code>$1</code>");
    response = response.replace(/\n/g, "<br>");
    return response;
  }
}

export default DetectionAction;
