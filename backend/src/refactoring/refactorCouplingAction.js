import RefactorAction from "./refactorAction.js";
import getFileWithDependencies from "../fileManager/filePrepare.js";
import project from "../Models/ProjectModel.js";
import { readFile } from "fs/promises";



class refactorCouplingAction extends RefactorAction {

  async refactorMethod(req) {

    console.log("refactor method-----------------------------------------------------------------------")
    const filePath = req?.body?.projectRoot;
    // const projectPath = req?.body?.projectPath;

    // console.log("request",req)
    if (!filePath ) {
      throw new Error("Missing filePath or projectPath in request.");
    }

    // let rootDir = filePath;
    // while (!rootDir.endsWith(path.join("src", "main", "java"))) {
    //   rootDir = path.dirname(rootDir);
    //   if (rootDir === path.dirname(rootDir)) break; // Prevent infinite loop
    // }

    // console.log("request data",reqData);
    // console.log(reqData.dependencies.length)
    // console.log("filePath ",filePath)
    // Read .codeaid-meta.json
    const metaFilePath = await this.findMetadataFile(filePath);
    let metaData;
    try {
      metaData = JSON.parse(await readFile(metaFilePath, "utf-8"));
    } catch (error) {
      throw new Error(
        `Failed to read or parse metadata file at ${metaFilePath}: ${error.message}`
      );
    }

    const projectId = metaData.projectId;
    if (!projectId) {
      throw new Error("projectId not found in metadata.");
    }

    // Fetch violations from DB
    const projectDoc = await project.findById(projectId).lean();
    if (!projectDoc) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    // console.log("project doc",projectDoc)

    // const fileViolations = projectDoc.couplingViolations?.find(
    //   (v) => v.mainFilePath === filePath
    // );


    const fileViolations = projectDoc.couplingViolations?.filter(
      (v) => Array.isArray(v.FilePaths) && v.FilePaths.includes(filePath)
    );

    console.log("file violation", fileViolations)

    if (!fileViolations || !fileViolations.couplingSmells) {
      throw new Error(`No Coupling violations found for file ${filePath}`);
    }

    // ✅ Add violations to reqData (to match the RefactoringRequestData schema)
    // reqData.violations = fileViolations.couplingSmells;

    // console.log("request data for file path",reqData.mainFilePath)
    // console.log("request data for file content",reqData.content)

    // ✅ Gather all unique file paths involved in this violation set
    const filePathsSet = new Set();
    for (const v of fileViolations) {
      if (Array.isArray(v.FilePaths)) {
        v.FilePaths.forEach(fp => filePathsSet.add(fp));
      }
    }

    // ✅ Read content for each file
    const contentArray = [];

    for (const file of filePathsSet) {
      try {
        const content = await readFile(file, "utf-8");
        contentArray.push({
          filePath: file,
          content,
        });
      } catch (err) {
        console.warn(`Failed to read file: ${file}`, err.message);
        // Optionally: skip or send empty string
        contentArray.push({
          filePath: file,
          content: "// Error reading file"
        });
      }
    }

    // ✅ Flatten all smells from all matched violations
    const allSmells = fileViolations.flatMap(v => v.smells);

    // ✅ Final request payload
    const reqData = {
      filesPaths: Array.from(filePathsSet),
      smells: allSmells,
      content: contentArray
    };

    // ✅ Send API request to refactor endpoint
    const response = await fetch("http://localhost:8000/refactor-coupling", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reqData),
    });

    if (!response.ok) {
      throw new Error(`API call failed with status ${response.status}`);
    }

    const result = await response.json();
    console.log("Refactoring result:", result);

    return result;
  }
}

export default refactorCouplingAction;


