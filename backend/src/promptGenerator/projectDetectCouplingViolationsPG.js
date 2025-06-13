import PromptGenerator from "./promptGenerator.js";

class ProjectDetectCOUPLINGViolationsPG extends PromptGenerator {
  generatePrompt(codeJSON, summary) {
    return `For the following Code: \n ${codeJSON}\n Act as Software Engineer and detect Coupling Smells. Then return the response in the form of pairs (Class, Smells), don't explain the violations`;
  }
}
export default ProjectDetectCOUPLINGViolationsPG;
