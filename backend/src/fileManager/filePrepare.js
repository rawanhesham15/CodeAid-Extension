import fg from "fast-glob";
import fs from "fs/promises";
import { parse } from "java-parser";
import path from "path";
import FileManager from './fileManager.js'

class FilePrepare {

  // async findJavaFiles(root) {
  //   try {
  //     const files = await fg("**/*.java", {
  //       cwd: root,
  //       absolute: true,
  //       // ignore: ["**/node_modules/**", "**/build/**", "**/out/**"],
  //       ignore: [
  //         "**/node_modules/**",
  //         "**/build/**",
  //         "**/System Volume Information/**",
  //         "**/$RECYCLE.BIN/**",
  //         "**/Recycler/**",
  //       ],
  //     });
  //     // console.log("Found Java files:", files);
  //     return files;
  //   } catch (error) {
  //     console.error(`Error in findJavaFiles for root ${root}:`, error.message);
  //     throw error;
  //   }
  // }

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

    // console.log("FQN Map:", fqnMap);
    return fqnMap;
  }

  async resolveDepsForFile(rootDir, srcFile) {
    try {
      const fqnMap = await this.buildFqnMap(rootDir);
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

      const { fqImports, wildcardPkgs, simpleNames } = await this.extractTypeNames(
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

  escape_newlines(str) {
    return str.replace(/\n/g, "\\n");
  }

  count_tokens(str) {
    return str.split(/\s+/).length;
  }

  async getFileWithDependenciesChunked(
    srcPath,
    projectRootDir,
    projectId
  ) {
    // MAX TOKENS LIMIT per chunk
    const MAX_TOKENS = 5000;
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
    const mainFileContent = this.escape_newlines(mainFile.content);
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
        const depContent = this.escape_newlines(await fs.readFile(depPath, "utf8"));
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
}

export default FilePrepare;