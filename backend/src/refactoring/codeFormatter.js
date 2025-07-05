import path from "path";
import fs from "fs";
import os from "os";
import { exec } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);
class CodeFormatter {
  async formatJavaWithGoogleFormat(files) {
    const jarPath = path.join(
      __dirname,
      "../../libs/google-java-format-1.27.0-all-deps.jar"
    );

    const formattedFiles = [];

    for (const file of files) {
      const tmpFile = path.join(os.tmpdir(), `temp-${Date.now()}.java`);
      const decodedContent = this._decodeEscapes(file.fileContent);
      fs.writeFileSync(tmpFile, decodedContent);

      const cmd = `java -jar "${jarPath}" "${tmpFile}"`;
      console.log(cmd);
      const formattedContent = await new Promise((resolve) => {
        exec(cmd, (error, stdout, stderr) => {
          fs.unlinkSync(tmpFile);
          if (error) {
            console.error(`Formatting failed for ${file.filePath}:`, stderr);
            // Return the original decoded content if formatting fails
            return resolve(decodedContent);
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

  _decodeEscapes(str) {
    return str
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\r/g, "\r")
      .replace(/\\f/g, "\f")
      .replace(/\\b/g, "\b")
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
}
export default CodeFormatter;
