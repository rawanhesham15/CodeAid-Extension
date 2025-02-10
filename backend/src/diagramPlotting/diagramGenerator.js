import path from "path";
import { exec } from "child_process";
import { PassThrough } from "stream";

class DiagramGenerator {
  constructor() {}

  async generateDiagram(parsedProject, projectPath, fileName) {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(projectPath, fileName);
      const diagramStream = new PassThrough();
      diagramStream.end(Buffer.from(parsedProject, "utf-8"));

      const command = `npx mmdc -i - -o "${outputPath}"  --scale 3 --backgroundColor white`;
      const child = exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(`Error generating diagram: ${error.message}`);
        } else {
          resolve(projectPath);
        }
      });

      diagramStream.pipe(child.stdin);
    });
  }
}

export default DiagramGenerator;
