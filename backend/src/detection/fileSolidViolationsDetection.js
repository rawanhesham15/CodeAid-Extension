import FileDetectSOLIDViolationsPG from "../promptGenerator/fileDetectSolidViolationsPG.js";
import DetectionAction from "./detectionAction.js";

class FileSOLIDViolationDetection extends DetectionAction {
  constructor(llmController, fileManager) {
    super(llmController, fileManager);
  }
  generatePrompt(codeJSON, summary) {
    let promptGenerator = new FileDetectSOLIDViolationsPG();
    return promptGenerator.generatePrompt(codeJSON.content, summary);
  }
}
export default FileSOLIDViolationDetection;
