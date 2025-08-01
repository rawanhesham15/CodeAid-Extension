import fg from "fast-glob";
import fs from "fs/promises";
import { parse } from "java-parser";
import path from "path";
import FileManager from './fileManager.js'

class FilePrepare {
  // Extract type names using regex
  extractSimpleNames(code) {
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

  async extractTypeNames(cst, code) {
    const fqImports = new Set();
    const wildcardPkgs = new Set();
    const simpleNames = this.extractSimpleNames(code);

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

    return {
      fqImports: Array.from(fqImports),
      wildcardPkgs: Array.from(wildcardPkgs),
      simpleNames,
    };
  }

  async buildFqnMap(root) {
    const fManger = new FileManager();
    const fqnMap = {};
    const files = await fManger.getAllJavaFilePaths(root);

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

    return fqnMap;
  }

  async resolveDepsForFile(rootDir, srcFile) {
    try {
      const fqnMap = await this.buildFqnMap(rootDir);

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

      const { fqImports, wildcardPkgs, simpleNames } =
        await this.extractTypeNames(cst, code);

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

      return Array.from(deps).sort();
    } catch (error) {
      console.error(
        `Error in resolveDepsForFile for ${srcFile}:`,
        error.message
      );
      throw error;
    }
  }

  cleanJavaCode(content) {
    // Step 1: Remove multiline comments (/* ... */)
    content = content.replace(/\/\*[\s\S]*?\*\//g, " ");

    // Step 2: Remove single-line comments (//...)
    content = content.replace(/\/\/.*$/gm, " ");

    // Step 3: Remove any sequence of \ before n or r
    content = content.replace(/(\\+)[nr]/g, " ");

    // Step 4: Remove actual line breaks (flatten the code to one line)
    content = content.replace(/[\r\n]+/g, " ");

    // Step 5: Collapse multiple spaces into one
    content = content.replace(/\s+/g, " ").trim();
    content = content.replace(/\\/g, "\\\\");

    return content;
  }

  count_tokens(str) {
    return str.split(/\s+/).length;
  }

  async getFileWithDependenciesChunked(srcPath, projectRootDir, projectId) {
    // MAX TOKENS LIMIT per chunk
    const MAX_TOKENS = 4000;
    const fileManager = new FileManager();
    const mainFile = fileManager.getFileContent(srcPath);
    if (!mainFile) throw new Error(`Failed to read file: ${srcPath}`);

    let depPaths = await this.resolveDepsForFile(projectRootDir, srcPath);
    const normalizedRoot = path.normalize(projectRootDir);
    depPaths = depPaths.filter((p) => {
      const normalizedPath = path.normalize(p);
      return (
        normalizedPath !== path.normalize(srcPath) &&
        normalizedPath.startsWith(normalizedRoot)
      );
    });

    const mainFilePath = path.normalize(mainFile.filePath);
    const mainFileContent = this.cleanJavaCode(mainFile.content);
    const mainFileTokens = this.count_tokens(mainFileContent);

    const promptChunks = [];
    let current_chunk_tokens = mainFileTokens;
    let chunk_id = 0;
    let chunk = {
      project_id: projectId,
      chunk_id: chunk_id,
      mainFilePath: mainFilePath,
      mainFileContent: mainFileContent,
      dependencies: [],
    };

    for (const depPath of depPaths) {
      try {
        await fs.access(depPath);
        const depContent = this.cleanJavaCode(
          await fs.readFile(depPath, "utf8")
        );
        const depTokens = this.count_tokens(depContent);
        const dependency = {
          depFilePath: path.normalize(depPath),
          depFileContent: depContent,
        };
        if (current_chunk_tokens + depTokens > MAX_TOKENS) {
          promptChunks.push(chunk);
          chunk_id++;
          chunk = {
            project_id: projectId,
            chunk_id: chunk_id,
            mainFilePath: mainFilePath,
            mainFileContent: mainFileContent,
            dependencies: [dependency],
          };
          current_chunk_tokens = mainFileTokens + depTokens;
        } else {
          chunk.dependencies.push(dependency);
          current_chunk_tokens += depTokens;
        }
      } catch (error) {
        console.error(
          `Failed to read dependency file ${depPath}:`,
          error.message
        );
      }
    }

    promptChunks.push(chunk);
    return promptChunks;
  }

  async resolveDependentsForFile(projectDir, targetFilePath) {
    const fileManager = new FileManager();
    const allJavaFiles = await fileManager.getAllJavaFilePaths(projectDir);

    const className = path.basename(targetFilePath, ".java"); 
    const dependents = [];

    for (const file of allJavaFiles) {
      if (file === targetFilePath) continue; // skip self

      const content = await fs.readFile(file, "utf-8");
      const regex = new RegExp(`\\b${className}\\b`);

      if (regex.test(content)) {
        dependents.push(file); // this file uses the class
      }
    }

    return dependents;
  }

  async getFileWithDependentsChunked(srcPath, projectRootDir, projectId) {
    const MAX_TOKENS = 5000;
    const fileManager = new FileManager();
    const mainFile = fileManager.getFileContent(srcPath);
    if (!mainFile) throw new Error(`Failed to read file: ${srcPath}`);

    // Replace dependency resolution with dependent resolution
    let dependentPaths = await this.resolveDependentsForFile(
      projectRootDir,
      srcPath
    );
    const normalizedRoot = path.normalize(projectRootDir);
    dependentPaths = dependentPaths.filter((p) => {
      const normalizedPath = path.normalize(p);
      return (
        normalizedPath !== path.normalize(srcPath) &&
        normalizedPath.startsWith(normalizedRoot)
      );
    });

    console.log("Dependent Paths", dependentPaths);
    const mainFilePath = path.normalize(mainFile.filePath);
    const mainFileContent = this.cleanJavaCode(mainFile.content);
    const mainFileTokens = this.count_tokens(mainFileContent);

    const promptChunks = [];
    let current_chunk_tokens = mainFileTokens;
    let chunk_id = 0;
    let chunk = {
      project_id: projectId,
      chunk_id: chunk_id,
      mainFilePath: mainFilePath,
      mainFileContent: mainFileContent,
      dependents: [],
    };

    for (const depPath of dependentPaths) {
      try {
        await fs.access(depPath);
        const depContent = this.cleanJavaCode(
          await fs.readFile(depPath, "utf8")
        );
        const depTokens = this.count_tokens(depContent);
        const dependent = {
          depFilePath: path.normalize(depPath),
          depFileContent: depContent,
        };
        if (current_chunk_tokens + depTokens > MAX_TOKENS) {
          promptChunks.push(chunk);
          chunk_id++;
          chunk = {
            project_id: projectId,
            chunk_id: chunk_id,
            mainFilePath: mainFilePath,
            mainFileContent: mainFileContent,
            dependents: [dependent],
          };
          current_chunk_tokens = mainFileTokens + depTokens;
        } else {
          chunk.dependents.push(dependent);
          current_chunk_tokens += depTokens;
        }
      } catch (error) {
        console.error(
          `Failed to read dependent file ${depPath}:`,
          error.message
        );
      }
    }

    promptChunks.push(chunk);
    return promptChunks;
  }
}

export default FilePrepare;
