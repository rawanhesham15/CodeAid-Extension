import fs from "fs";
import path from "path";
import { readdir } from "fs/promises";
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

}

export default FileManager;
