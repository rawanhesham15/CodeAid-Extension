import path from "path";
import fs from "fs";
import os from "os";
import { exec } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CodeFormatter {
  async formatJavaWithGoogleFormat(files) {
    const jarPath = path.join(__dirname, "../../libs/google-java-format-1.27.0-all-deps.jar");

    const formattedFiles = [];

    for (const file of files) {
      const tmpFile = path.join(os.tmpdir(), `temp-${Date.now()}.java`);
      fs.writeFileSync(tmpFile, file.fileContent);

      const cmd = `java -jar "${jarPath}" "${tmpFile}"`;

      const formattedContent = await new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
          fs.unlinkSync(tmpFile);
          if (error) {
            console.error("Formatting error:", stderr);
            return reject(new Error(`Formatting failed for ${file.filePath}`));
          }
          resolve(stdout);
        });
      });

      formattedFiles.push({
        filePath: file.filePath,
        fileContent: formattedContent,
      });
    }

    return formattedFiles;
  }
}

export default CodeFormatter;
