import fs from "fs"
import path from "path"

class FileManager {
  /**
   *
   * @param {string} dirPath
   * @param {string} fileName
   */
  createFile(dirPath, fileName) {
    const filePath = path.join(dirPath, fileName);
    try{
      if(!fs.existsSync(dirPath)){
        fs.mkdirSync(dirPath, {recursive: true});
      }
      fs.writeFileSync(filePath, "", "utf-8");
    } catch(error) {
      console.error(`Error creating file: ${error.message}`)
    }
  }
  /**
   *
   * @param {string} dirPath
   * @returns {Object[]}
   */
  getProjectContent(dirPath) {
    try {
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      let filesData = [];

      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        if (item.isDirectory()) {
          filesData = filesData.concat(this.getProjectContent(fullPath)); // Recursively process subdirectories
        } else if (item.name.endsWith(".java")){
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
  /**
   *
   * @param {string} filePath
   * @returns {Object|null}
   */
  getFileContent(filePath) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      return { filePath, content };
    } catch (error) {
      console.error(`Error reading file: ${error.message}`);
      return null;
    }
  }
  /**
   *
   * @param {string} filePath
   * @param {string} content
   */
  updateFileContent(filePath, content) {
    try {
      fs.writeFileSync(filePath, content, "utf8");
    } catch (error) {
      console.error(`Error updating file: ${error.message}`);
    }
  }
  /**
   *
   * @param {string} filePath
   */
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
}

export default FileManager;