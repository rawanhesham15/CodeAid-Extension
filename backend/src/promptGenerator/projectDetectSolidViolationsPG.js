import PromptGenerator from "./promptGenerator.js";

class ProjectDetectSOLIDViolationsPG extends PromptGenerator {
  constructor() {
    super();
  }
  generatePrompt(codeJSON, summary) {
    return `For the following Code in Json format: \n ${codeJSON}\n Act as Software Engineer and detect SOLID violations. Then return the response in the form of pairs (Class, Principles Violated)`;
  }
}
export default ProjectDetectSOLIDViolationsPG;
