const path = require("path");
const { exec } = require("child_process");
const fs = require("fs");
const { PassThrough } = require("stream");

class DiagramGenerator {
  constructor() {}

  generateDiagram(parsedProject, projectPath) {
    const outputFileName = "Class_diagram.png";
    const outputPath = path.join(projectPath, outputFileName);
    const diagramStream = new PassThrough();
    diagramStream.end(Buffer.from(parsedProject, "utf-8"));
    const command = `npx mmdc -o "${outputPath}"`;
    const child = exec(command, (error) => {
      if (error) {
        return `Error generating diagram: ${error.message}`;
      }
      return null;
    });
    diagramStream.pipe(child.stdin);
  }
}
