import ProjectDetectSOLIDViolationsPG from "../promptGenerator/projectDetectSolidViolationsPG.js";
import DetectionAction from "./detectionAction.js";

class ProjectSOLIDViolationDetection extends DetectionAction {
  generatePrompt(codeJSON, summary) {
    let codeString = "";
    codeJSON.forEach((file) => {
      codeString = codeString + file.content;
    });
    let promptGenerator = new ProjectDetectSOLIDViolationsPG();
    return promptGenerator.generatePrompt(codeString, summary);
  }
}
export default ProjectSOLIDViolationDetection;