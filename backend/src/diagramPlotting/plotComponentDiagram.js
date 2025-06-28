import fs from "fs";
import path from "path";
import PlottingAction from "./plottingAction.js";
import DependenciesExtractor from "./dependenciesExtractor.js";

class PlotComponentDiagram extends PlottingAction {
  constructor(diagramGenerator, fileManager) {
    super(diagramGenerator, fileManager);
    this.dependenciesExtractor = new DependenciesExtractor();
  }

  async generateDiagram(parsedProject, projectPath) {
    console.log("Generating component diagram with Mermaid syntax:\n", parsedProject);
    if (!parsedProject || parsedProject.trim() === "graph TD;") {
      throw new Error("Empty or invalid Mermaid syntax");
    }
    const fileName = "Component_Diagram.svg";
    const outputPath = path.join(path.resolve(projectPath), fileName);
    console.log("Output path:", outputPath);
    await this.diagramGenerator.generateDiagram(
      parsedProject,
      projectPath,
      fileName
    );
    if (!fs.existsSync(outputPath)) {
      throw new Error("Diagram file was not created");
    }
    // return outputPath;
  }

  guessRole(filename, content, filePath) {
    const lowerPath = filePath.toLowerCase();
    const lowerFilename = filename.toLowerCase();
    if (
      lowerPath.includes("/controller") ||
      lowerPath.includes("\\controller") ||
      lowerFilename.includes("controller") ||
      content.includes("@Controller")
    ) {
      return "Controller";
    }
    if (
      lowerPath.includes("/service") ||
      lowerPath.includes("\\service") ||
      lowerFilename.includes("service") ||
      content.includes("@Service")
    ) {
      return "Service";
    }
    if (
      lowerPath.includes("/repository") ||
      lowerPath.includes("\\repository") ||
      lowerFilename.includes("repository") ||
      content.includes("@Repository")
    ) {
      return "Repository";
    }
    if (
      lowerPath.includes("/dao") ||
      lowerPath.includes("\\dao") ||
      lowerFilename.includes("dao")
    ) {
      return "DAO";
    }
    if (
      lowerPath.includes("/model") ||
      lowerPath.includes("\\model") ||
      lowerFilename.includes("entity") ||
      lowerFilename.includes("model") ||
      content.includes("@Entity")
    ) {
      return "Database";
    }
    if (
      lowerPath.includes("/util") ||
      lowerPath.includes("\\util") ||
      lowerFilename.includes("util")
    ) {
      return "Helper";
    }
    if (
      lowerPath.includes("/test") ||
      lowerPath.includes("\\test") ||
      lowerFilename.includes("test") ||
      content.includes("@Test")
    ) {
      return "Test";
    }
    if (
      lowerPath.includes("/configuration") ||
      lowerPath.includes("\\configuration") ||
      lowerFilename.includes("config") ||
      content.includes("@Configuration")
    ) {
      return "Configuration";
    }
    if (lowerFilename.includes("application")) {
      return "Application";
    }
    return "Helper";
  }

  toMermaidBox(name, role) {
    const displayName = `${name}.java`;
    if (role === "Database") {
      return `${name}[(${displayName})]`; // Cylinder for Database
    }
    if (role === "Test") {
      return `${name}[${displayName}]`; // Simple rectangle for Tests (changed from hexagon)
    }
    return `${name}[[${displayName}]]`; // Rectangle for all other roles
  }

  toEdge(from, to) {
    return `${from} --> ${to}`;
  }

  parseProject(projectJSON) {
    // Validate projectJSON
    if (!Array.isArray(projectJSON) || projectJSON.length === 0) {
      console.warn("projectJSON is empty or not an array");
      return "graph TD;\n  NoFiles[No Java files provided]";
    }

    // Filter valid Java files
    const javaFiles = projectJSON.filter(
      (file) =>
        file &&
        typeof file === "object" &&
        typeof file.filePath === "string" &&
        typeof file.content === "string" &&
        file.filePath.toLowerCase().endsWith(".java")
    );

    if (javaFiles.length === 0) {
      console.warn("No valid .java files found in projectJSON", projectJSON);
      return "graph TD;\n  NoFiles[No Java files found]";
    }

    console.log(
      "Found .java files:",
      javaFiles.map((f) => f.filePath)
    );

    const nodes = new Map();
    const componentsByPackage = new Map();

    // Transform projectJSON for DependenciesExtractor
    const extractorJSON = javaFiles.map((file) => ({
      path: file.filePath,
      content: file.content,
    }));

    // Extract dependencies
    const dependencies = this.dependenciesExtractor.extractDependencies(extractorJSON);

    // Phase 1: Add all nodes and group by package
    for (const file of javaFiles) {
      const filePath = file.filePath;
      const content = file.content;
      const fileName = path.basename(filePath, ".java");
      const role = this.guessRole(fileName, content, filePath);
      nodes.set(fileName, { role, filePath });

      const packageMatch = content.match(/package\s+([\w.]+);/);
      const packageName = packageMatch ? packageMatch[1] : "unnamed";
      console.log(
        `Added node: ${fileName} (${role}) in package: ${packageName}`
      );

      if (!componentsByPackage.has(packageName)) {
        componentsByPackage.set(packageName, []);
      }
      componentsByPackage.get(packageName).push(fileName);
    }

    // Phase 2: Add edges from dependencies
    const edges = [];
    for (const [className, deps] of dependencies.entries()) {
      for (const dependency of deps) {
        if (nodes.has(dependency)) {
          edges.push([className, dependency]);
          console.log(`Added edge: ${className} --> ${dependency}`);
        } else {
          console.log(
            `Edge discarded: ${className} --> ${dependency} (target not in project)`
          );
        }
      }
    }

    const lines = ["graph TD"];

    // Create subgraphs for each package
    for (const [packageName, components] of componentsByPackage) {
      if (components.length > 0) {
        const safePackageName = packageName.replace(/\./g, "_");
        lines.push(`  subgraph ${safePackageName}["${packageName}"]`);
        for (const name of components) {
          const { role } = nodes.get(name);
          lines.push(`    ${this.toMermaidBox(name, role)}`);
        }
        lines.push("  end");
      }
    }

    // Add edges
    for (const [from, to] of edges) {
      lines.push(`  ${this.toEdge(from, to)}`);
    }

    if (lines.length === 1) {
      lines.push("  NoComponents[No components found]");
    }

    const result = lines.join("\n");
    console.log("Generated Mermaid syntax:\n", result);
    return result;
  }
}

export default PlotComponentDiagram;