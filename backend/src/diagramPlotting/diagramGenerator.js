import path from "path";
import { exec } from "child_process";
import { PassThrough } from "stream";

class DiagramGenerator {
  constructor() {}

  generateDiagram(parsedProject, projectPath, fileName) {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(projectPath, fileName);
      const diagramStream = new PassThrough();
      diagramStream.end(Buffer.from(parsedProject, "utf-8"));

      const command = `npx mmdc -o "${outputPath}"`;
      const child = exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(`Error generating diagram: ${error.message}`);
        } else if (stderr) {
          reject(`stderr: ${stderr}`);
        } else {
          resolve(projectPath); // Success, return project path
        }
      });

      diagramStream.pipe(child.stdin);
    });
  }
}

export default DiagramGenerator;
