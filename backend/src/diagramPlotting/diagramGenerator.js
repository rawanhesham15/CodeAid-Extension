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

      console.log(`Starting diagram generation for: ${fileName}`);
      const command = `npx mmdc -i - -o "${outputPath}"  --scale 3 --backgroundColor white`;
      const child = exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error generating diagram: ${error.message}`);
          reject(`Error generating diagram: ${error.message}`);
        } else if (stderr) {
          console.warn(`stderr: ${stderr}`);
          reject(`stderr: ${stderr}`);
        } else {
          console.log(`Diagram generated successfully at: ${outputPath}`);
          resolve(projectPath);
        }
      });

      diagramStream.pipe(child.stdin);
    });
  }
}

export default DiagramGenerator;
