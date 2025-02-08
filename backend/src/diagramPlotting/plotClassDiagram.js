import PlottingAction  from "./plottingAction.js";
import Parser from "tree-sitter";
import Java from "tree-sitter-java";
import fs from "fs";
import path from "path";
import DiagramGenerator from "./diagramGenerator.js"; // Import DiagramGenerator

export class PlotClassDiagram extends PlottingAction {
  constructor(diagramGenerator, fileManager) {
    super(diagramGenerator, fileManager);
    this.parser = new Parser();
    this.parser.setLanguage(Java);
  }

  /**
   * Parse the Java code from an array of JSON objects containing file paths and content.
   * @param {Array} projectFiles - An array of objects, each containing file path and content.
   * @returns {String} - Mermaid code for class diagram.
   */
  parseProject(projectFiles) {
    if (!Array.isArray(projectFiles)) {
      console.error("Expected an array of project files.");
      return;
    }

    let allClasses = [];
    let allRelationships = [];

    projectFiles.forEach(file => {
      //console.log(`Parsing file: ${file.filePath}`);
      const javaCode = file.content;

      // Parse the Java code using Tree-sitter
      const tree = this.parser.parse(javaCode);
      const rootNode = tree.rootNode;

      const classes = [];
      const relationships = [];

      function traverse(node) {
        if (!node) return;

        //console.log(`Visiting node type: ${node.type}`);

        // Detect class declarations
        if (node.type === "class_declaration") {
          const classNameNode = node.namedChildren.find(child => 
            child.type === "identifier" || child.type === "type_identifier"
          );
          const className = classNameNode ? classNameNode.text : "Unknown";

          const classObj = {
            name: className,
            type: "class",
            attributes: [],
            methods: []
          };

          // Handle inheritance relationships
          const extendsNode = node.namedChildren.find(child => child.type === "superclass");
          if (extendsNode) {
            const parentClassNode = extendsNode.namedChildren.find(c => c.type === "type_identifier");
            if (parentClassNode) {
              relationships.push({
                type: "inheritance",
                from: className,
                to: parentClassNode.text
              });
            }
          }

          // Traverse class body to extract fields and methods
          const classBody = node.namedChildren.find(child => child.type === "class_body");
          if (classBody) {
            classBody.namedChildren.forEach(classMember => {
              if (classMember.type === "field_declaration") {
                handleFieldDeclaration(classMember, classObj, relationships);
              } else if (classMember.type === "method_declaration") {
                handleMethodDeclaration(classMember, classObj, relationships);
              }
            });
          }

          classes.push(classObj);
        }

        node.namedChildren.forEach(child => traverse(child));
      }

      function handleFieldDeclaration(node, classObj, relationships) {
       // console.log(`Field declaration node children:`, node.namedChildren.map(c => c.type));
        const typeNode = node.namedChildren.find(c => 
          c.type === "type" || 
          c.type === "integral_type" || 
          c.type === "floating_point_type" || 
          c.type === "type_identifier"
        );
        const variableDeclarators = node.namedChildren.filter(c => c.type === "variable_declarator");

        variableDeclarators.forEach(declarator => {
          const fieldNameNode = declarator.namedChildren.find(c => c.type === "identifier");
          const fieldType = typeNode ? typeNode.text : "Unknown";
          const fieldName = fieldNameNode ? fieldNameNode.text : "Unknown";

          //console.log(`Field detected in ${classObj.name}: ${fieldName} of type ${fieldType}`);

          const visibilityNode = node.namedChildren.find(c => c.type === "modifiers");
          const visibility = visibilityNode ? (visibilityNode.text.includes("private") ? "-" : "+") : "+";

          classObj.attributes.push({
            visibility,
            type: fieldType,
            name: fieldName
          });

          const primitiveTypes = ["int", "double", "float", "boolean", "char", "byte", "short", "long", "String"];
          if (!primitiveTypes.includes(fieldType)) {
            relationships.push({
              type: "association",
              from: classObj.name,
              to: fieldType
            });
          }
        });
      }

      function handleMethodDeclaration(node, classObj, relationships) {
        const methodNameNode = node.namedChildren.find(c => c.type === "identifier");
        const returnTypeNode = node.namedChildren.find(c => c.type === "type" || c.type === "void_type");
        const parametersNode = node.namedChildren.find(c => c.type === "formal_parameters");

        const parameters = parametersNode
          ? parametersNode.namedChildren.filter(param => param.type === "formal_parameter").map(param => {
              const paramTypeNode = param.namedChildren.find(c => 
                c.type === "type" || 
                c.type === "integral_type" || 
                c.type === "floating_point_type" || 
                c.type === "type_identifier"
              );
              const paramNameNode = param.namedChildren.find(c => c.type === "identifier");
              return {
                type: paramTypeNode ? paramTypeNode.text : "Unknown",
                name: paramNameNode ? paramNameNode.text : "Unknown"
              };
            })
          : [];

        if (methodNameNode) {
          const visibilityNode = node.namedChildren.find(c => c.type === "modifiers");
          const visibility = visibilityNode ? (visibilityNode.text.includes("private") ? "-" : "+") : "+";

          classObj.methods.push({
            visibility,
            name: methodNameNode.text,
            returnType: returnTypeNode ? returnTypeNode.text : "void",
            parameters
          });

          const primitiveTypes = ["int", "double", "float", "boolean", "char", "byte", "short", "long", "String"];
          parameters.forEach(param => {
            if (!primitiveTypes.includes(param.type)) {
              relationships.push({
                type: "method_dependency",
                from: classObj.name,
                to: param.type
              });
            }
          });
        }
      }

      traverse(rootNode);

      allClasses = allClasses.concat(classes);
      allRelationships = allRelationships.concat(relationships);
    });

    let mermaidCode = "classDiagram\n";
    allClasses.forEach(cls => {
      mermaidCode += `    class ${cls.name} {\n`;

      cls.attributes.forEach(attr => {
        mermaidCode += `        ${attr.visibility}${attr.name}: ${attr.type}\n`;
      });

      cls.methods.forEach(method => {
        const params = method.parameters.map(param => `${param.name}: ${param.type}`).join(", ");
        mermaidCode += `        ${method.visibility}${method.name}(${params}): ${method.returnType}\n`;
      });

      mermaidCode += "    }\n";
    });

    allRelationships.forEach(rel => {
      if (rel.type === "inheritance") {
        mermaidCode += `${rel.to} <|-- ${rel.from}\n`;
      } else if (rel.type === "association") {
        mermaidCode += `${rel.from} --> ${rel.to}\n`;
      } else if (rel.type === "method_dependency") {
        mermaidCode += `${rel.from} ..> ${rel.to}\n`;
      }
    });

    return mermaidCode;
  }

  async generateDiagram(parsedProject, projectPath) {
    await this.diagramGenerator.generateDiagram(
      parsedProject,
      projectPath,
      "Class_diagram.png"
    );
  }
  
}

export default PlotClassDiagram;