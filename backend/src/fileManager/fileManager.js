import fs from "fs";
import path from "path";
import { readdir } from "fs/promises";
import { exec } from "child_process";
import dbManager from "../dbManager/dbManager.js";


class FileManager {

  createFile(dirPath, fileName) {
    const filePath = path.join(dirPath, fileName);
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      fs.writeFileSync(filePath, "", "utf-8");
    } catch (error) {
      console.error(`Error creating file: ${error.message}`);
    }
  }
  gatherCode(path) {
    const stats = fs.statSync(path);
    try {
      if (stats.isFile()) {
        return this.getFileContent(path);
      } else if (stats.isDirectory()) {
        return this.getProjectContent(path);
      } else {
        return {};
      }
    } catch (error) {
      return {};
    }
  }

  getProjectContent(dirPath) {
    try {
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      let filesData = [];

      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        if (item.isDirectory()) {
          filesData = filesData.concat(this.getProjectContent(fullPath)); // Recursively process subdirectories
        } else if (item.name.endsWith(".java")) {
          const fileContent = this.getFileContent(fullPath);
          if (fileContent) {
            filesData.push(fileContent);
          }
        }
      }

      return filesData;
    } catch (error) {
      console.error(`Error reading directory: ${dirPath} - ${error.message}`);
      return [];
    }
  }
  getFileContent(filePath) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      return { filePath, content };
    } catch (error) {
      console.error(`Error reading file: ${error.message}`);
      return null;
    }
  }
  updateFileContent(filePath, content) {
    try {
      fs.writeFileSync(filePath, content, "utf8");
    } catch (error) {
      console.error(`Error updating file: ${error.message}`);
    }
  }
  deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`File deleted: ${filePath}`);
      } else {
        console.error("File does not exist.");
      }
    } catch (error) {
      console.error(`Error deleting file: ${error.message}`);
    }
  }
  // Recursively get all .java files from a directory
  async getAllJavaFiles(dirPath) {
    const entries = await readdir(dirPath, { withFileTypes: true });
    const files = await Promise.all(
      entries.map((entry) => {
        const res = path.resolve(dirPath, entry.name);
        return entry.isDirectory() ? this.getAllJavaFiles(res) : res;
      })
    );
    return files.flat().filter((file) => file.endsWith(".java"));
  }


  async undo(path,projectPath) {
    const db = new dbManager();
    const lastState = await db.undo(path);
    const paths = await this.getAllJavaFiles(projectPath)
    for (const file of paths) {
      if(!lastState.allFilePaths.includes(file)) {
        try {
          await vscode.workspace.fs.delete(vscode.Uri.file(file));
        } catch (err) {
          vscode.window.showWarningMessage(`Failed to delete file: ${file}`);
          console.error(`Error deleting file ${file}`, err);
        }
      }
    }
    for (const file of lastState.filePathsLastState) {
      const uri = vscode.Uri.file(file.filePath);
      try {
        // Ensure directory exists
        const dirPath = vscode.Uri.file(require("path").dirname(file.filePath));
        await vscode.workspace.fs.createDirectory(dirPath);

        // Write new content directly
        const encoder = new TextEncoder();
        const contentBytes = encoder.encode(file.content);
        await vscode.workspace.fs.writeFile(uri, contentBytes);

      } catch (err) {
        vscode.window.showWarningMessage(`Failed to write file: ${file.filePath}`);
        console.error(`Error writing file ${file.filePath}`, err);
      }
    }
  }
/**
   * Check if a Java file and its dependencies are syntactically valid.
   * @param {string} mainFilePath - Path to the main Java file.
   * @param {string[]} dependencyPaths - Array of file paths that the main file depends on.
   * @returns {Promise<{ isValid: boolean, errorMessage?: string }>}
   */
  // async checkJavaSyntaxWithDependencies(mainFilePath, dependencyPaths) {
  //   return new Promise((resolve) => {
  //     const allFiles = [mainFilePath, ...dependencyPaths].map(f => `"${f}"`).join(" ");
  //     const compileCommand = `javac ${allFiles}`;

  //     exec(compileCommand, (error, stdout, stderr) => {
  //       if (error) {
  //         resolve({ isValid: false, errorMessage: stderr });
  //       } else {
  //         resolve({ isValid: true , errorMessage: ""});
  //       }
  //     });
  //   });
  // }


//   async checkJavaSyntax(filePath) {
//   return new Promise((resolve) => {
//     exec(`javac "${filePath}"`, (error, stdout, stderr) => {
//       if (error) {
//         resolve({ isValid: false, errorMessage: stderr });
//       } else {
//         resolve({ isValid: true, errorMessage: "" });
//       }
//     });
//   });
// }


async checkProjectJavaSyntax(allJavaFiles) {
  return new Promise((resolve) => {
    // Include the main file and all dependencies
    const allFiles = allJavaFiles
      .filter(Boolean)                     // remove null/undefined
      .map(f => `"${f}"`)                  // wrap each path in quotes
      .join(" ");                          // space-separated list

      console.log("ttttttttttttttttttttttttttttt" ,allFiles);
    const compileCommand = `javac ${allFiles}`;

    exec(compileCommand, (error, stdout, stderr) => {
      if (error) {
        resolve({ isValid: false, errorMessage: stderr });
      } else {
        resolve({ isValid: true, errorMessage: "" });
      }
    });
  });
}

  // async checkProjectSyntax(dirPath) {
  //   const javaFiles = await this.getAllJavaFiles(dirPath);
  //   const results = await Promise.all(
  //     javaFiles.map(async (file) => {
  //       const error = await this.checkJavaSyntax(file);
  //       return error ? { filePath: file, error } : { filePath: file };
  //     })
  //   );
  //   return results;
  // }
}

export default FileManager;
