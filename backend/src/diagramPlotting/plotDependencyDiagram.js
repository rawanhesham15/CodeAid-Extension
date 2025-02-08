import PlottingAction from "./plottingAction.js";
import DependenciesExtractor from "./dependenciesExtractor.js";

class PlotDependencyDiagram extends PlottingAction {
  constructor(diagramGenerator, fileManager) {
    super(diagramGenerator, fileManager);
  }
  parseProject(projectJSON) {
    var depExtractor = new DependenciesExtractor();
    var dependencies = depExtractor.extractDependencies(projectJSON);
    var parsedProject = "graph TD;\n";
    for (const [className, deps] of dependencies.entries()) {
      for (const dep of deps) {
        parsedProject += `  ${className} --> ${dep};\n`;
      }
    }
    return parsedProject;
  }
  async generateDiagram(parsedProject, projectPath) {
    await this.diagramGenerator.generateDiagram(
      parsedProject,
      projectPath,
      "Dep_Diagram.png"
    );
  }
}

export default PlotDependencyDiagram;
