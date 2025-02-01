"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectFormatter = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ProjectFormatter {
    getAllJavaFiles(dir) {
        let javaFiles = [];
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                javaFiles = javaFiles.concat(this.getAllJavaFiles(fullPath));
            }
            else if (file.endsWith(".java")) {
                javaFiles.push(fullPath);
            }
        }
        return javaFiles;
    }
    extractImports(filePath) {
        const content = fs.readFileSync(filePath, "utf-8");
        const importLines = content.match(/^import\s+([\w.]+);/gm) || [];
        return importLines.map((line) => line.replace(/^import\s+|;$/g, "").trim());
    }
    buildClusters(files) {
        const dependencyGraph = new Map();
        const filePathMap = new Map();
        files.forEach((file) => {
            const baseName = path.basename(file, ".java");
            filePathMap.set(baseName, file);
        });
        for (const file of files) {
            const imports = this.extractImports(file);
            const fileName = path.basename(file, ".java");
            if (!dependencyGraph.has(fileName)) {
                dependencyGraph.set(fileName, new Set());
            }
            imports.forEach((imported) => {
                const importedFileName = imported.split(".").pop();
                if (filePathMap.has(importedFileName)) {
                    dependencyGraph.get(fileName)?.add(importedFileName);
                }
            });
        }
        const clusters = new Set();
        for (const [file, dependencies] of dependencyGraph.entries()) {
            const cluster = new Set();
            cluster.add(filePathMap.get(file));
            dependencies.forEach((dep) => cluster.add(filePathMap.get(dep)));
            clusters.add(cluster);
        }
        return clusters;
    }
}
exports.ProjectFormatter = ProjectFormatter;
//# sourceMappingURL=project_formatter.js.map