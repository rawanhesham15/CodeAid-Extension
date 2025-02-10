import ProjectDetectSOLIDViolationsPG from "../promptGenerator/projectDetectSolidViolationsPG.js";
import DetectionAction from "./detectionAction.js";

class ProjectSOLIDViolationDetection extends DetectionAction {
  constructor(llmController, fileManager) {
    super(llmController, fileManager);
  }
  generatePrompt(codeJSON, summary) {
    let promptGenerator = new ProjectDetectSOLIDViolationsPG();
    return promptGenerator.generatePrompt(codeJSON, summary);
  }
}
export default ProjectSOLIDViolationDetection;