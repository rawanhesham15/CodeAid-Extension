import RefactorAction from "./refactorAction.js";
import getFileWithDependenciesChunked from "../fileManager/filePrepare.js";
import project from "../Models/ProjectModel.js";
import { readFile } from "fs/promises";

import path from "path";


class refactorSolidViolationsAction extends RefactorAction {

  async refactorMethod(req) {

    console.log("refactor method---------------------------------------------------------------------")
    const filePath = req?.body?.path;
    const rootDir = req?.body?.rootDir;
    console.log("filePath", filePath)
    console.log("rootDir", rootDir)
    // console.log("request",req)
    if (!filePath ) {
      throw new Error("Missing filePath or projectPath in request.");
    }

    //let rootDir = filePath;
    // while (!rootDir.endsWith(path.join("src", "main", "java"))) {
    //   rootDir = path.dirname(rootDir);
    //   if (rootDir === path.dirname(rootDir)) break; // Prevent infinite loop
    // }
  const metaFilePath = await this.findMetadataFile(rootDir);
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

    const reqData = await getFileWithDependenciesChunked(filePath, rootDir,projectId);
    console.log("request data",reqData);
    // console.log(reqData.dependencies.length)
    console.log("filePath ",filePath)
    // Read .codeaid-meta.json
    // Fetch violations from DB
    const projectDoc = await project.findById(projectId).lean();
    if (!projectDoc) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    console.log("project doc",projectDoc)

    // const fileViolations = projectDoc.solidViolations?.find(
    //   (v) => v.mainFilePath === filePath
    // );
    // const fileDoc = projectDoc.solidViolations[0];
    // for(const entry in reqData)
    // {
    //   entry.violations = fileDoc.violations;
    // }
    //reqData.violations =fileDoc.violations || [];
    // if (!fileDoc || !fileDoc.violations.length) {
    //   throw new Error(`No SOLID violations found for file ${filePath}`);
    // }
    // let dependencies = [];
    // for (const dep of reqData) {
    //   for (const depFile of dep.dependencies) {
    //     if (depFile.depFilePath) {
    //       dependencies.push({ depFilePath: depFile.depFilePath , depFileContent: depFile.depFileContent});
    //     }
    //   }
    // }
    // console.log("file doc ", fileDoc)
    // ✅ Add violations to reqData (to match the RefactoringRequestData schema)
    console.log("request again",reqData)
    // console.log("request data for file path",reqData.mainFilePath)
    // console.log("request data for file content",reqData.mainFileContent)
    let sentData = {
      data: reqData, 
      violations: projectDoc.solidViolations[0].violations,
    };
    console.log(sentData)
    // ✅ Send API request to refactor endpoint
    const response = await fetch("http://localhost:8000/refactor-solid", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sentData),
    });

    if (!response.ok) {
      throw new Error(`API call failed with status ${response.status}`);
    }

    const result = await response.json();
    console.log("Refactoring result:", result);

    // return result;
    let formattedFiles =
      await this.codeFormatter.formatJavaWithGoogleFormat(result.refactored_files);
    console.log(formattedFiles)
    return formattedFiles;
  }
}

export default refactorSolidViolationsAction;

//[{'file_path': 'c:\\Users\\marwa\\Downloads\\ToffeeStore\\category.java', 'violatedPrinciples': [{'principle': 'Single Responsibility', 'justification': 'The category class handles both data management (storing items) and presentation logic (displayCategoryItem method). These are two distinct responsibilities that should be separated into different classes.'}, {'principle': 'Dependency Inversion', 'justification': 'The displayCategoryItem method directly depends on the concrete item class. High-level modules should depend on abstractions rather than concrete implementations.'}]}, {'file_path': 'c:\\Users\\marwa\\Downloads\\ToffeeStore\\item.java', 'violatedPrinciples': [{'principle': 'Single Responsibility', 'justification': 'The item class manages item data and also handles presentation logic (displayItem and displayItemForCart methods). These responsibilities should be separated into different classes.'}, {'principle': 'Dependency Inversion', 'justification': 'The displayItem and displayItemForCart methods directly depend on the concrete category class. High-level modules should depend on abstractions rather than concrete implementations.'}]}]