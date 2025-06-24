import ProjectDetectSOLIDViolationsPG from "../promptGenerator/projectDetectSolidViolationsPG.js";
import DetectionAction from "./detectionAction.js";
import project from "../Models/ProjectModel.js";
import { readFile, stat } from "fs/promises";
import path from "path";
import getFileWithDependencies from "../fileManager/filePrepare.js";
import fg from "fast-glob";

class ProjectSOLIDViolationDetection extends DetectionAction {
  generatePrompt(codeJSON, summary) {
    let codeString = "";
    codeJSON.forEach((file) => {
      codeString = codeString + file.content;
    });
    let promptGenerator = new ProjectDetectSOLIDViolationsPG();
    return promptGenerator.generatePrompt(codeString, summary);
  }

  async getAllJavaFiles(rootDir) {
    return await fg("**/*.java", {
      cwd: rootDir,
      absolute: true,
      ignore: ["**/build/**", "**/out/**", "**/node_modules/**"],
    });
  }

  async detectionMethod(req) {
    const projectPath = req?.body?.path;
    if (!projectPath || typeof projectPath !== "string") {
      throw new Error("Invalid or missing project path.");
    }

    console.log("Project path:", projectPath);

    // const codeJSON = this.gatherCode(projectPath);
    // const summarizedCode = this.summarize(projectPath);
    // const prompt = this.generatePrompt(codeJSON, summarizedCode);
    // const response = await this.processPrompt(prompt); // Use real response instead of dummy
    // const parsed = typeof response === 'string' ? JSON.parse(response) : response;
    // const violations = parsed.violations;

    // const rootDir = this.resolveJavaRoot(projectPath);

    const metaFilePath = await this.findMetadataFile(projectPath);

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

    const javaFiles = await this.getAllJavaFiles(projectPath);
    console.log("Found Java files:", javaFiles);
    for (const filePath of javaFiles) {
      try {
        const reqData = await getFileWithDependencies(filePath, projectPath);
        const dependencies = reqData.dependencies.map((dep) => dep.depFilePath);
        const apiData = [reqData];
        console.log("filePath", filePath);
        console.log("dependencies  ", dependencies);
        const res = await fetch("http://localhost:8000/detect-solid", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiData),
        });


        if (!res.ok) throw new Error(`API failed for ${filePath}`);
        console.log("before before")
        const parsed = await res.json();
        console.log("parsed",parsed)
        const violations = parsed;
        console.log("before save")
        await this.saveViolations(violations, projectId, dependencies);
        console.log(`Detected for: ${filePath}`);
      } catch (error) {
        console.error(`Failed for ${filePath}:`, error.message);
        continue;
      }
    }

    const dummyResponse = `[
  {
    "project_id": 105,
    "chunk_id": 0,
    "prompt": {
      "main_file_path": "SecExample-main\\\\.mvn\\\\wrapper\\\\MavenWrapperDownloader.java",
      "main_file_content": "import java.net.*; import java.io.*; import java.nio.channels.*; import java.util.Properties; public class MavenWrapperDownloader { ... }",
      "dependencies": []
    },
    "task": "SOLID Violations Detection",
    "output_schema": "{\\"$defs\\": {\\"ViolatedPrinciple\\": {\\"properties\\": {\\"principle\\": {\\"description\\": \\"The violated SOLID principle.\\", \\"enum\\": [\\"Single Responsibility\\", \\"Open-Closed\\", \\"Liskov\\", \\"Interface Segregation\\", \\"Dependency Inversion\\"], \\"title\\": \\"Principle\\", \\"type\\": \\"string\\"}, \\"justification\\": {\\"description\\": \\"Explanation of why the principle was violated in 2 sentences only.\\", \\"maxLength\\": 300, \\"title\\": \\"Justification\\", \\"type\\": \\"string\\"}}, \\"required\\": [\\"principle\\", \\"justification\\"], \\"title\\": \\"ViolatedPrinciple\\", \\"type\\": \\"object\\"}, \\"Violation\\": {\\"properties\\": {\\"file_path\\": {\\"description\\": \\"Path of the file containing the violation.\\", \\"title\\": \\"File Path\\", \\"type\\": \\"string\\"}, \\"violatedPrinciples\\": {\\"description\\": \\"List of violated principles with justifications.\\", \\"items\\": {\\"$ref\\": \\"#/$defs/ViolatedPrinciple\\"}, \\"title\\": \\"Violatedprinciples\\", \\"type\\": \\"array\\"}}, \\"required\\": [\\"file_path\\", \\"violatedPrinciples\\"], \\"title\\": \\"Violation\\", \\"type\\": \\"object\\"}}, \\"properties\\": {\\"violations\\": {\\"description\\": \\"Detected SOLID violations.\\", \\"items\\": {\\"$ref\\": \\"#/$defs/Violation\\"}, \\"title\\": \\"Violations\\", \\"type\\": \\"array\\"}}, \\"required\\": [\\"violations\\"], \\"title\\": \\"SolidDetectionOutput\\", \\"type\\": \\"object\\"}",
    "violations": [
      {
        "file_path": "SecExample-main\\\\.mvn\\\\wrapper\\\\MavenWrapperDownloader.java",
        "violatedPrinciples": [
          {
            "principle": "Single Responsibility",
            "justification": "The class handles multiple responsibilities including reading properties files, managing directories, downloading files via HTTP, and handling authentication. These distinct functions should be separated into different classes."
          }
        ]
      }
    ]
  },
  {
    "project_id": 105,
    "chunk_id": 0,
    "prompt": {
      "main_file_path": "SecExample-main\\\\src\\\\main\\\\java\\\\com\\\\suyu\\\\secexample\\\\csrf\\\\controller\\\\csrfcontroller.java",
      "main_file_content": "package com.suyu.secexample.csrf.controller; ...",
      "dependencies": [
        {
          "file_path": "SecExample-main\\\\src\\\\main\\\\java\\\\com\\\\suyu\\\\secexample\\\\csrf\\\\model\\\\User.java",
          "file_content": "package com.suyu.secexample.csrf.model; ..."
        },
        {
          "file_path": "SecExample-main\\\\src\\\\main\\\\java\\\\com\\\\suyu\\\\secexample\\\\csrf\\\\service\\\\UsernameService.java",
          "file_content": "package com.suyu.secexample.csrf.service; ..."
        }
      ]
    },
    "task": "SOLID Violations Detection",
    "output_schema": "...",
    "violations": [
      {
        "file_path": "SecExample-main\\\\src\\\\main\\\\java\\\\com\\\\suyu\\\\secexample\\\\csrf\\\\controller\\\\csrfcontroller.java",
        "violatedPrinciples": [
          {
            "principle": "Single Responsibility",
            "justification": "The class handles multiple responsibilities including reading properties files, managing directories, downloading files via HTTP, and handling authentication. These distinct functions should be separated into different classes."
          },
          {
            "principle": "Open-Closed",
            "justification": "The class is not extendable for new download methods (e.g., FTP, retry mechanisms) without modifying existing code. Adding new functionality would require changes to the downloadFileFromURL method."
          }
        ]
      },
      {
        "file_path": "SecExample-main\\\\src\\\\main\\\\java\\\\com\\\\suyu\\\\secexample\\\\csrf\\\\model\\\\User.java",
        "violatedPrinciples": [
          {
            "principle": "Single Responsibility",
            "justification": "The class handles multiple responsibilities including reading properties files, managing directories, downloading files via HTTP, and handling authentication. These distinct functions should be separated into different classes."
          }
        ]
      }
    ]
  },
  {
    "project_id": 105,
    "chunk_id": 0,
    "prompt": {
      "main_file_path": "SecExample-main\\\\src\\\\main\\\\java\\\\com\\\\suyu\\\\secexample\\\\csrf\\\\mapper\\\\UsernameMapper.java",
      "main_file_content": "package com.suyu.secexample.csrf.mapper; ...",
      "dependencies": [
        {
          "file_path": "SecExample-main\\\\src\\\\main\\\\java\\\\com\\\\suyu\\\\secexample\\\\csrf\\\\model\\\\User.java",
          "file_content": "package com.suyu.secexample.csrf.model; ..."
        }
      ]
    },
    "task": "SOLID Violations Detection",
    "output_schema": "...",
    "violations": [
    {
        "file_path": "SecExample-main\\\\src\\\\main\\\\java\\\\com\\\\suyu\\\\secexample\\\\csrf\\\\mapper\\\\UsernameMapper.java",
        "violatedPrinciples": [
          {
            "principle": "Single Responsibility",
            "justification": "The class handles multiple responsibilities including reading properties files, managing directories, downloading files via HTTP, and handling authentication. These distinct functions should be separated into different classes."
          },
          {
            "principle": "Open-Closed",
            "justification": "The class is not extendable for new download methods (e.g., FTP, retry mechanisms) without modifying existing code. Adding new functionality would require changes to the downloadFileFromURL method."
          }
        ]
      }
    ]
  }
]`;

  //   let parsed;
  //   try {
  //     parsed = JSON.parse(dummyResponse);
  //   } catch (error) {
  //     console.error("Failed to parse JSON:", error.message);
  //     throw error;
  //   }

  //   // console.log("Parsed response:", parsed);

  
  //   await this.clearViolationsForProject(projectId);

  //   console.log("Extracted projectId:", projectId);

  //   for (const entry of parsed) {
  //     const violations = entry.violations || [];
  //     const mainFilePath = entry.prompt.main_file_path;
  //     const dependenciesFilePaths =
  //       entry.prompt.dependencies?.map((dep) => dep.file_path) || [];

  //     const solidViolations = violations.map((violation) => ({
  //       mainFilePath: mainFilePath,
  //       dependenciesFilePaths: dependenciesFilePaths,
  //       violations: violation.violatedPrinciples.map((principleObj) => ({
  //         principle: principleObj.principle,
  //         justification: principleObj.justification,
  //       })),
  //     }));

  //     await this.saveViolations(solidViolations, projectId,dependenciesFilePaths);
  //   }
  //   let allFormattedViolations = [];

  //   for (const entry of parsed) {
  //     const violations = entry.violations || [];
  //     const mainFilePath = entry.prompt.main_file_path;

  //     for (const violation of violations) {
  //       const filePath = violation.file_path;
  //       const principles = violation.violatedPrinciples;

  //       for (const principleObj of principles) {
  //         const { principle, justification } = principleObj;
  //         allFormattedViolations.push(
  //           `File: ${filePath}\nPrinciple: ${principle}\nJustification: ${justification}\n`
  //         );
  //       }
  //     }
  //   }

  //   const formattedViolationsString = allFormattedViolations.join("\n---\n");

  //   return formattedViolationsString;
  }


async saveViolations(violations, projectId, dependencies) {
  if (!projectId || typeof projectId !== "string") {
    throw new Error("Invalid project ID");
  }

  if (!Array.isArray(violations)) {
    throw new Error("Violations must be an array.");
  }

  const allowedPrinciples = ["Single Responsibility", "Open-Closed"];
  const mainFileViolations = violations[0];

  // Filter principles
  const filteredPrinciples = mainFileViolations.violations.filter((p) =>
    allowedPrinciples.includes(p.principle)
  );

  if (filteredPrinciples.length === 0) {
    console.log(
      `Skipping save: No SRP or OCP violations found for file ${mainFileViolations?.mainFilePath}`
    );
    return;
  }

  const formatted = {
    mainFilePath: mainFileViolations.mainFilePath || "unknown",
    dependenciesFilePaths: dependencies,
    violations: filteredPrinciples,
  };

  try {
    const updatedProject = await project.findByIdAndUpdate(
      projectId,
      { $push: { solidViolations: [formatted] } },
      { new: true }
    );

    if (!updatedProject) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    console.log("Filtered SOLID violations saved successfully:", formatted);
  } catch (error) {
    console.error(
      `Error saving filtered violations for project ${projectId}: ${error.message}`,
      {
        projectId,
        violations,
        stack: error.stack,
      }
    );
    throw error;
  }
}


  async clearViolationsForProject(projectId) {
    await project.updateOne(
      { _id: projectId },
      { $set: { solidViolations: [] } }
    );
  }
}
export default ProjectSOLIDViolationDetection;
