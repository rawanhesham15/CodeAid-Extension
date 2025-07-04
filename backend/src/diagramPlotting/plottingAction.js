import DiagramGenerator from "./diagramGenerator.js";
import FileManager from "../filesManagement/fileManager.js";
class PlottingAction {
  constructor() {
    this.diagramGenerator = new DiagramGenerator();
    this.fileManager = new FileManager();
    if (new.target === PlottingAction) {
      throw new Error("Can't instantiate an abstract class directly");
    }
  }
  async createDiagram(req){
    const javaFiles = await this.fileManager.getAllJavaFilePaths(req.body.path);
    const { isValid, errorMessage } = await this.fileManager.checkProjectJavaSyntax(
      javaFiles
    );

    if (!isValid) {
      console.error("❌ Java syntax error:\n");
      // return a clean string instead of throwing
      return "Java syntax error in the provided files";
    
  }
    var projectJSON = this.gatherCode(req.body.path);
    var parsedProject = this.parseProject(projectJSON);
    var returnedVal = await this.generateDiagram(parsedProject, req.body.path);
    return returnedVal;
  }
  gatherCode(path) {
    var projectContent = this.fileManager.gatherCode(path);
    return projectContent;
  }
  parseProject(projectJSON) {}
  async generateDiagram(parsedCode, projectPath) {}
}

export default PlottingAction;
