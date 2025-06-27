import DetectionAction from "./detectionAction.js";
import fileDetectCouplingViolationsPG from "./../promptGenerator/fileDetectCouplingViolationsPG.js";
import { readFile } from "fs/promises";
import project from "../Models/ProjectModel.js";
import path from "path";
import getFileWithDependenciesChunked from "./../fileManager/filePrepare.js";
class fileCOUPLINGViolationDetection extends DetectionAction {
  async detectionMethod(req) {
    const filePath = req?.body?.path;
    if (!filePath || typeof filePath !== "string") {
      throw new Error("Invalid or missing project path.");
    }

    console.log("Project path:", filePath);

    let rootDir = req?.body?.rootDir || path.dirname(filePath);

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

    await this.clearViolationsForProject(projectId);

    console.log("Extracted projectId:", projectId);
    const reqData = await getFileWithDependenciesChunked(
      filePath,
      rootDir,
      projectId
    ); // this is the file content with dependencies

    let dependencies = [];
    for (const dep of reqData) {
      for (const depFile of dep.dependencies) {
        if (depFile.depFilePath) {
          dependencies.push(depFile.depFilePath);
        }
      }
    }
    console.log("Dependencies found:", dependencies);
    // console.log("Request data for SOLID detection:", reqData);

    const apiData = reqData;

    let result;
    try {
      const response = await fetch("http://localhost:8000/detect-coupling", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      
      if (!response.ok) {
        throw new Error(`API call failed with status ${response.status}`);
      }

      result = await response.json();
      console.log("Coupling Violations:", result);
    } catch (error) {
      console.error("Error calling detect-solid API:", error);
      throw error;
    }

    let parsed = result;
    console.log("parsed ", parsed);
    await this.saveViolations(parsed, projectId);
    return parsed;
  }

  // async saveViolations(violations, projectId) {
  //   if (!projectId || typeof projectId !== "string") {
  //     throw new Error("Invalid project ID");
  //   }

  //   for (const v of violations) {
  //     const filePath = v.filesPaths || "unknown";
  //     const smells = v.couplingSmells || [];

  //     let formattedViolations = {
  //       FilePaths: filePath,
  //       couplingSmells: smells.map((p) => ({
  //         smell: p.smell,
  //         justification: p.justification,
  //       })),
  //     };

  //     console.log(
  //       "Formatted coupling violations for saving:",
  //       JSON.stringify(formattedViolations, null, 2)
  //     );

  //     try {
  //       const updatedProject = await project.findByIdAndUpdate(
  //         projectId,
  //         { $push: { couplingViolations: formattedViolations } },
  //         { new: true }
  //       );

  //       if (!updatedProject) {
  //         throw new Error(`Project with ID ${projectId} not found`);
  //       }

  //       console.log("Updated project successfully:", updatedProject._id);
  //     } catch (error) {
  //       console.error(
  //         `Error saving violations for project ${projectId}: ${error.message}`,
  //         {
  //           projectId,
  //           violations,
  //           stack: error.stack,
  //         }
  //       );
  //       throw error;
  //     }
  //   }
  // }


    async saveViolations(violations, projectId) {
      if (!projectId || typeof projectId !== "string") {
        throw new Error("Invalid project ID");
      }
  
      for (const v of violations) {
        // const filePaths = v.filesPaths || [];
  
        for (const smellGroup of v.couplingSmells || []) {
          const smellFilePaths = smellGroup.filesPaths || [];
          const smells = smellGroup.smells || [];
  
          const formatted = {
            FilePaths: smellFilePaths,
            couplingSmells: smells.map((s) => ({
              smell: s.smell,
              justification: s.justification,
            })),
          };
  
          console.log(
            "Formatted coupling violation for saving:",
            JSON.stringify(formatted, null, 2)
          );
  
          try {
            const updatedProject = await project.findByIdAndUpdate(
              projectId,
              { $push: { couplingViolations: formatted } },
              { new: true }
            );
  
            if (!updatedProject) {
              throw new Error(`Project with ID ${projectId} not found`);
            }
  
            console.log("Updated project successfully:", updatedProject._id);
          } catch (error) {
            console.error(
              `Error saving violations for project ${projectId}: ${error.message}`,
              {
                projectId,
                violations,
                stack: error.stack,
              }
            );
            throw error;
          }
        }
      }
    }

  // formatViolationsAsString(parsed) {
  //   let allFormattedViolations = [];

  //   for (const entry of parsed) {
  //     const filePaths = entry.filesPaths || [];
  //     const smells = entry.couplingSmells || [];

  //     for (const smellObj of smells) {
  //       const { smell, justification } = smellObj;
  //       allFormattedViolations.push(
  //         `File(s): ${filePaths.join(
  //           ", "
  //         )}\nSmell: ${smell}\nJustification: ${justification}`
  //       );
  //     }
  //   }

  //   return allFormattedViolations.join("\n---\n");
  // }

  formatViolationsAsString(parsed) {
    let allFormattedViolations = [];

    for (const entry of parsed) {
      // const mainFilePaths = entry.filesPaths || [];
      const couplingSmells = entry.couplingSmells || [];

      for (const smellGroup of couplingSmells) {
        const smellFilePaths = smellGroup.filesPaths || [];
        const smells = smellGroup.smells || [];

        for (const smellObj of smells) {
          const { smell, justification } = smellObj;

          allFormattedViolations.push(
            // `Main File(s): ${mainFilePaths.join(", ")}\n` +
            `Affected File(s): ${smellFilePaths.join(", ")}\n` +
            `Smell: ${smell}\n` +
            `Justification: ${justification}`
          );
        }
      }
    }

    return allFormattedViolations.join("\n---\n");
  }

  async clearViolationsForProject(projectId) {
    await project.updateOne(
      { _id: projectId },
      { $set: { couplingViolations: [] } }
    );
  }
}

export default fileCOUPLINGViolationDetection;

//[{"filesPaths": ["c:\\\\Users\\\\marwa\\\\Downloads\\\\ToffeeStore\\\\category.java", "c:\\\\Users\\\\marwa\\\\Downloads\\\\ToffeeStore\\\\item.java"], "smells": [{"smell": "Message Chains", "justification": "The `category.displayCategoryItem()` method exhibits a message chain by calling `items.get(i).getCategory().getName()`. This forces the `category` class to navigate through `item` to `category` again to retrieve a name, violating the Law of Demeter."}, {"smell": "Message Chains", "justification": "The `item.displayItem()` and `item.displayItemForCart()` methods both use a message chain `category.getName()`. Although `item` holds a direct reference to `category`, it asks `category` for its name instead of using its own state, which could be considered a minor chain if `item` should manage its category\'s display name."}]}]\n```'}]
