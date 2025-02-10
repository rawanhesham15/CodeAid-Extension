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
    // this.saveViolations(response, prjctID);
    return this.formatLLMResponse(response);
  }
  /**
   *
   * @param {string} path
   * @returns {Object[]}
   */
  gatherCode(path) {
    return this.fileManager.gatherCode(path);
  }
  /**
   *
   * @param {string} path
   * @returns {string}
   */
  summarize(path) {
    return "";
  }
  /**
   *
   * @param {Object} codeJSON
   * @param {string} summary
   * @returns {string}
   */
  generatePrompt(codeJSON, summary) {}
  /**
   *
   * @param {string} prompt
   * @returns {Object}
   */
  async processPrompt(prompt) {
    return this.llmController.generateResponse(prompt);
  }
  /**
   *
   * @param {Object} violations
   * @param {string} prjctID
   */
  saveViolations(violations, prjctID) {
    return "";
  }
  formatLLMResponse(response) {
    // Convert **bold** to <b>bold</b>
    response = response.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");

    // Convert *italic* to <i>italic</i>
    response = response.replace(/\*(.*?)\*/g, "<i>$1</i>");

    // Convert `code` to <code>code</code>
    response = response.replace(/`(.*?)`/g, "<code>$1</code>");

    // Convert new lines to <br> for HTML rendering
    response = response.replace(/\n/g, "<br>");

    return response;
  }
}

export default DetectionAction;
