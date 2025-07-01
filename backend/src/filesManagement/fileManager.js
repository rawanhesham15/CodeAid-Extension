import fs from "fs";
import path from "path";
import { readdir } from "fs/promises";
import { exec } from "child_process";
import ProjectManager from "./projectManager.js";
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
  async getAllJavaFilePaths(dirPath) {
    console.log("Getting all Java file paths from:", dirPath);
    const entries = await readdir(dirPath, { withFileTypes: true });
    const files = await Promise.all(
      entries.map((entry) => {
        const res = path.resolve(dirPath, entry.name);
        console.log("Processing entry:", res);
        return entry.isDirectory() ? this.getAllJavaFilePaths(res) : res;
      })
    );
    return files.flat().filter((file) => file.endsWith(".java"));
  }
  async checkProjectJavaSyntax(allJavaFiles) {
  return new Promise((resolve) => {
    // Include the main file and all dependencies
    const allFiles = allJavaFiles
      .filter(Boolean)                     // remove null/undefined
      .map(f => `"${f}"`)                  // wrap each path in quotes
      .join(" ");                          // space-separated list
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
}
export default FileManager;
