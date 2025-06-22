import fg from "fast-glob";
import fs from "fs/promises";
import { parse } from "java-parser";
import path from "path";

// Temporary FileManager
class FileManager {
  async getFileContent(filePath) {
    try {
      const content = await fs.readFile(filePath, "utf8");
      return {
        filePath: path.normalize(filePath),
        content,
      };
    } catch (error) {
      console.error(
        `FileManager.getFileContent failed for ${filePath}:`,
        error.message
      );
      return null;
    }
  }
}

async function findJavaFiles(root) {
  try {
    const files = await fg("**/*.java", {
      cwd: root,
      absolute: true,
      ignore: ["**/node_modules/**", "**/build/**", "**/out/**"],
    });
    // console.log("Found Java files:", files);
    return files;
  } catch (error) {
    console.error(`Error in findJavaFiles for root ${root}:`, error.message);
    throw error;
  }
}

// Extract type names using regex
function extractSimpleNames(code) {
  const simpleNames = new Set();
  // Match class/interface declarations, type references, and generic types
  const typeRegex =
    /\b(?:class|interface)\s+(\w+)|(\w+)(?=\s+\w+\s*(?:=|\(|\{|<|;))|(\w+)(?=\s*\.\s*\w+)|(\w+)(?=<)|(\w+)(?=>)/g;
  let match;
  while ((match = typeRegex.exec(code))) {
    if (match[1]) simpleNames.add(match[1]); // Class/interface names
    if (match[2]) simpleNames.add(match[2]); // Type references
    if (match[3]) simpleNames.add(match[3]); // Qualified types
    if (match[4]) simpleNames.add(match[4]); // Generic types before <
    if (match[5]) simpleNames.add(match[5]); // Generic types before >
  }
  return simpleNames;
}

async function extractTypeNames(cst, code) {
  const fqImports = new Set();
  const wildcardPkgs = new Set();
  const simpleNames = extractSimpleNames(code);

  // Access ordinaryCompilationUnit
  const compilationUnit = cst.children.ordinaryCompilationUnit?.[0];
  if (!compilationUnit) {
    console.error("No ordinaryCompilationUnit found in CST");
    return {
      fqImports: Array.from(fqImports),
      wildcardPkgs: Array.from(wildcardPkgs),
      simpleNames,
    };
  }

  // Debug CST structure
  // console.log("CST keys:", Object.keys(cst.children));
  // console.log("Compilation unit keys:", Object.keys(compilationUnit.children || {}));
  // console.log(
  //   "Import declarations count:",
  //   (compilationUnit.children.importDeclaration || []).length
  // );

  // Process imports
  try {
    for (const imp of compilationUnit.children.importDeclaration || []) {
      const qName =
        imp.children.qualifiedName?.[0] ||
        imp.children.qualifiedIdentifier?.[0];
      if (!qName) continue;

      const identifiers =
        qName.children?.Identifier?.map((id) => id.image) || [];
      if (identifiers.length > 0) {
        const qn = identifiers.join(".");
        if (imp.children?.asterisk) {
          wildcardPkgs.add(identifiers.slice(0, -1).join(".") || qn);
        } else {
          fqImports.add(qn);
          simpleNames.add(identifiers[identifiers.length - 1]); // Add imported type
        }
      }
    }
  } catch (error) {
    console.error("Error processing imports:", error.message);
  }

  // console.log("Extracted fqImports:", Array.from(fqImports));
  // console.log("Extracted wildcardPkgs:", Array.from(wildcardPkgs));
  // console.log("Extracted simpleNames:", Array.from(simpleNames));

  return {
    fqImports: Array.from(fqImports),
    wildcardPkgs: Array.from(wildcardPkgs),
    simpleNames,
  };
}

async function buildFqnMap(root) {
  const fqnMap = {};
  const files = await findJavaFiles(root);

  for (const file of files) {
    try {
      const code = await fs.readFile(file, "utf8");
      const packageMatch = code.match(/^package\s+([\w.]+);/m);
      const pkgName = packageMatch ? packageMatch[1] : "";
      const classMatch = code.match(/\b(?:class|interface)\s+(\w+)/);
      if (classMatch) {
        const name = classMatch[1];
        const key = pkgName ? `${pkgName}.${name}` : name;
        fqnMap[key] = path.normalize(file);
      }
    } catch (error) {
      console.error(`Error processing file ${file}:`, error.message);
    }
  }

  // console.log("FQN Map:", fqnMap);
  return fqnMap;
}

export async function resolveDepsForFile(rootDir, srcFile) {
  try {
    const fqnMap = await buildFqnMap(rootDir);
    // console.log("FQN Map built:", fqnMap);

    if (
      !(await fs
        .access(srcFile)
        .then(() => true)
        .catch(() => false))
    ) {
      throw new Error(`Source file not found: ${srcFile}`);
    }

    const code = await fs.readFile(srcFile, "utf8");
    let cst;
    try {
      cst = parse(code);
    } catch (parseError) {
      console.error(`Parse error in ${srcFile}:`, parseError.message);
      throw parseError;
    }

    const { fqImports, wildcardPkgs, simpleNames } = await extractTypeNames(
      cst,
      code
    );

    const deps = new Set();
    const covered = new Set();

    const compilationUnit = cst.children.ordinaryCompilationUnit?.[0];
    const pkgNode = compilationUnit?.children.packageDeclaration?.[0];
    const pkgIdentifiers =
      pkgNode?.children.qualifiedName?.[0]?.children.Identifier ||
      pkgNode?.children.qualifiedIdentifier?.[0]?.children.Identifier;
    const pkgName = pkgIdentifiers?.map((id) => id.image).join(".") || "";

    // 1) Fully-qualified imports
    for (const fqn of fqImports) {
      const simple = fqn.split(".").pop();
      if (simpleNames.has(simple) && fqnMap[fqn] && fqnMap[fqn] !== srcFile) {
        deps.add(fqnMap[fqn]);
        covered.add(simple);
      }
    }

    // 2) Wildcard imports
    for (const pkg of wildcardPkgs) {
      for (const simple of simpleNames) {
        if (covered.has(simple)) continue;
        const candidate = `${pkg}.${simple}`;
        if (fqnMap[candidate] && fqnMap[candidate] !== srcFile) {
          deps.add(fqnMap[candidate]);
          covered.add(simple);
        }
      }
    }

    // 3) Same-package classes
    for (const simple of simpleNames) {
      if (covered.has(simple)) continue;
      const candidate = pkgName ? `${pkgName}.${simple}` : simple;
      if (fqnMap[candidate] && fqnMap[candidate] !== srcFile) {
        deps.add(fqnMap[candidate]);
        covered.add(simple);
      }
    }

    // 4) Fallback suffix match
    for (const simple of simpleNames) {
      if (covered.has(simple)) continue;
      for (const [fqn, pathToFile] of Object.entries(fqnMap)) {
        if (fqn.endsWith(`.${simple}`) && pathToFile !== srcFile) {
          deps.add(pathToFile);
          break;
        }
      }
    }

    // console.log("Resolved dependencies:", Array.from(deps));
    return Array.from(deps).sort();
  } catch (error) {
    console.error(`Error in resolveDepsForFile for ${srcFile}:`, error.message);
    throw error;
  }
}

async function getFileWithDependencies(srcPath, projectRootDir) {
  // console.log("Project root:", projectRootDir);
  // console.log("Attempting to access file:", srcPath);

  try {
    const fileManager = new FileManager();
    const canAccess = await fs
      .access(srcPath)
      .then(() => true)
      .catch(() => false);
    console.log("File accessible:", canAccess);
    if (!canAccess) {
      throw new Error(`Source file not found: ${srcPath}`);
    }
    // console.log("Calling FileManager.getFileContent...");
    const mainFile = await fileManager.getFileContent(srcPath);
    // console.log("FileManager.getFileContent result:", mainFile);
    if (!mainFile) {
      // console.error(`Failed to read file: ${srcPath}`);
      throw new Error(`Failed to read file: ${srcPath}`);
    }

    // console.log("Main file read successfully:", mainFile.filePath);

    let depPaths = [];
    try {
      depPaths = await resolveDepsForFile(projectRootDir, srcPath);
      depPaths = depPaths.filter(
        (p) => path.normalize(p) !== path.normalize(srcPath)
      ); // to avoid self-dependency
      // console.log("Dependencies for", srcPath, ":", depPaths);
    } catch (error) {
      console.error("Error resolving dependencies:", error.message);
      throw error;
    }

    // Read content for each dependency
    const dependencies = [];
    for (const depPath of depPaths) {
      try {
        await fs.access(depPath); // add this
        const depContent = await fs.readFile(depPath, "utf8");
        console.log(`Read dependency file: ${depPath} and its content : ${depContent}`);
        dependencies.push({
          depFilePath: path.normalize(depPath),
          content: depContent,
        });
      } catch (error) {
        console.error(
          `Failed to read dependency file ${depPath}:`,
          error.message
        );
        // Skip failed dependencies to avoid blocking
        continue;
      }
    }

    return {
      mainFilePath: mainFile.filePath,
      content: mainFile.content,
      dependencies,
    };
  } catch (error) {
    console.error(
      `Error in getFileWithDependencies for ${srcPath}:`,
      error.message,
      error.stack
    );
    throw error;
  }
}

export default getFileWithDependencies;
