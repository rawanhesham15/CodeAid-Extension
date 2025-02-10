import PlottingAction from "./plottingAction.js";
import Parser from "tree-sitter";
import Java from "tree-sitter-java";

export class PlotClassDiagram extends PlottingAction {
  constructor(diagramGenerator, fileManager) {
    super(diagramGenerator, fileManager);
    this.parser = new Parser();
    this.parser.setLanguage(Java);
  }

  parseProject(projectFiles) {
    if (!Array.isArray(projectFiles)) {
      console.error("Expected an array of project files.");
      return;
    }

    let allClasses = [];
    let allRelationships = [];

<<<<<<< HEAD
    projectFiles.forEach((file) => {
=======
    projectFiles.forEach(file => {
>>>>>>> 558c6422c27d3d201a476532d3ee7229115e224e
      const javaCode = file.content;

      // Parse Java code
      const tree = this.parser.parse(javaCode);
      const rootNode = tree.rootNode;

      const classes = [];
      const relationships = new Set(); // Use a set to avoid duplicates

      function traverse(node) {
        if (!node) return;

<<<<<<< HEAD
=======
        // Detect class declarations
>>>>>>> 558c6422c27d3d201a476532d3ee7229115e224e
        if (node.type === "class_declaration") {
          const classNameNode = node.namedChildren.find(
            (child) =>
              child.type === "identifier" || child.type === "type_identifier"
          );
          const className = classNameNode?.text || "Unknown";

          const classObj = {
            name: className,
            type: "class",
            attributes: [],
            methods: [],
          };

          // Handle inheritance
          const extendsNode = node.namedChildren.find(
            (child) => child.type === "superclass"
          );
          if (extendsNode) {
            const parentClassNode = extendsNode.namedChildren.find(
              (c) => c.type === "type_identifier"
            );
            if (parentClassNode) {
              relationships.add(
                JSON.stringify({
                  type: "inheritance",
                  from: className,
                  to: parentClassNode.text,
                })
              );
            }
          }

          // Traverse class body
          const classBody = node.namedChildren.find(
            (child) => child.type === "class_body"
          );
          if (classBody) {
            classBody.namedChildren.forEach((classMember) => {
              if (classMember.type === "field_declaration") {
                handleFieldDeclaration(classMember, classObj);
              } else if (classMember.type === "method_declaration") {
                handleMethodDeclaration(classMember, classObj);
              }
            });
          }

          classes.push(classObj);
        }

        node.namedChildren.forEach((child) => traverse(child));
      }

<<<<<<< HEAD
      function handleFieldDeclaration(node, classObj) {
        const typeNode = node.namedChildren.find((c) =>
          [
            "type",
            "integral_type",
            "floating_point_type",
            "type_identifier",
            "generic_type",
            "array_type",
          ].includes(c.type)
        );

        const variableDeclarators = node.namedChildren.filter(
          (c) => c.type === "variable_declarator"
        );

        variableDeclarators.forEach((declarator) => {
          const fieldNameNode = declarator.namedChildren.find(
            (c) => c.type === "identifier"
          );
          const fieldName = fieldNameNode?.text || "Unknown";
=======
      function sanitizeType(type) {
        return type.replace(/\[\]/g, "Array");
      }

      function handleFieldDeclaration(node, classObj, relationships) {
        const typeNode = node.namedChildren.find(c => 
          c.type === "type" || 
          c.type === "integral_type" || 
          c.type === "floating_point_type" || 
          c.type === "type_identifier" || 
          c.type === "generic_type" || 
          c.type === "array_type"
        );

        const variableDeclarators = node.namedChildren.filter(c => c.type === "variable_declarator");

        variableDeclarators.forEach(declarator => {
          const fieldNameNode = declarator.namedChildren.find(c => c.type === "identifier");
          const fieldName = fieldNameNode ? fieldNameNode.text : "Unknown";

          let fieldType = "Unknown";

          if (typeNode) {
            if (typeNode.type === "generic_type") {
              const containerType = typeNode.namedChildren.find(c => c.type === "type_identifier")?.text;
              const genericType = typeNode.namedChildren.find(c => c.type === "type_arguments")
                                ?.namedChildren.find(c => c.type === "type_identifier")?.text;
              fieldType = `${containerType}<${genericType}>`;

              if (genericType) {
                relationships.push({
                  type: "association",
                  from: classObj.name,
                  to: sanitizeType(genericType)
                });
              }
            } else {
              fieldType = sanitizeType(typeNode.text);
            }
          }
>>>>>>> 558c6422c27d3d201a476532d3ee7229115e224e

          let fieldType = "Unknown";
          if (typeNode) {
            if (typeNode.type === "generic_type") {
              const containerType = typeNode.namedChildren.find(
                (c) => c.type === "type_identifier"
              )?.text;
              const genericType = typeNode.namedChildren
                .find((c) => c.type === "type_arguments")
                ?.namedChildren.find((c) => c.type === "type_identifier")?.text;
              fieldType = genericType
                ? `${containerType}<${genericType}>`
                : containerType;
            } else {
              fieldType = typeNode.text;
            }
          }

          const visibilityNode = node.namedChildren.find(
            (c) => c.type === "modifiers"
          );
          const visibility = visibilityNode?.text.includes("private")
            ? "-"
            : "+";

          classObj.attributes.push({
            visibility,
            type: fieldType,
            name: fieldName,
          });

<<<<<<< HEAD
          const primitiveTypes = [
            "int",
            "double",
            "float",
            "boolean",
            "char",
            "byte",
            "short",
            "long",
          ];
          const excludedTypes = ["List", "Set", "Map"];
          const containerType = fieldType.split("<")[0];

          if (
            !primitiveTypes.includes(fieldType) &&
            !excludedTypes.includes(containerType)
          ) {
            relationships.add(
              JSON.stringify({
                type: "association",
                from: classObj.name,
                to: fieldType,
              })
            );
=======
          const primitiveTypes = ["int", "double", "float", "boolean", "char", "byte", "short", "long", "String"];
          const excludedTypes = ["List", "Set", "Map"];
          const containerType = fieldType.split('<')[0];
          if (!primitiveTypes.includes(fieldType) && !excludedTypes.includes(containerType)) {
            relationships.push({
              type: "association",
              from: classObj.name,
              to: sanitizeType(fieldType)
            });
>>>>>>> 558c6422c27d3d201a476532d3ee7229115e224e
          }
        });
      }

      function handleMethodDeclaration(node, classObj) {
        const methodNameNode = node.namedChildren.find(
          (c) => c.type === "identifier"
        );
        const returnTypeNode = node.namedChildren.find((c) =>
          ["type", "void_type"].includes(c.type)
        );
        const parametersNode = node.namedChildren.find(
          (c) => c.type === "formal_parameters"
        );

        const parameters = parametersNode
<<<<<<< HEAD
          ? parametersNode.namedChildren
              .filter((param) => param.type === "formal_parameter")
              .map((param) => {
                const paramTypeNode = param.namedChildren.find((c) =>
                  [
                    "type",
                    "integral_type",
                    "floating_point_type",
                    "type_identifier",
                    "generic_type",
                  ].includes(c.type)
                );
                const paramNameNode = param.namedChildren.find(
                  (c) => c.type === "identifier"
                );

                let paramType = paramTypeNode?.text || "Unknown";
                if (paramTypeNode?.type === "generic_type") {
                  const containerType = paramTypeNode.namedChildren.find(
                    (c) => c.type === "type_identifier"
                  )?.text;
                  const genericType = paramTypeNode.namedChildren
                    .find((c) => c.type === "type_arguments")
                    ?.namedChildren.find(
                      (c) => c.type === "type_identifier"
                    )?.text;
                  paramType = genericType
                    ? `${containerType}<${genericType}>`
                    : containerType;
                }

                return {
                  type: paramType,
                  name: paramNameNode?.text || "Unknown",
                };
              })
=======
          ? parametersNode.namedChildren.filter(param => param.type === "formal_parameter").map(param => {
              const paramTypeNode = param.namedChildren.find(c => 
                c.type === "type" || 
                c.type === "integral_type" || 
                c.type === "floating_point_type" || 
                c.type === "type_identifier" ||
                c.type === "generic_type"
              );
              const paramNameNode = param.namedChildren.find(c => c.type === "identifier");

              let paramType = "Unknown";
              if (paramTypeNode) {
                if (paramTypeNode.type === "generic_type") {
                  const containerType = paramTypeNode.namedChildren.find(c => c.type === "type_identifier")?.text;
                  const genericType = paramTypeNode.namedChildren.find(c => c.type === "type_arguments")
                                    ?.namedChildren.find(c => c.type === "type_identifier")?.text;
                  paramType = `${containerType}<${genericType}>`;
                } else {
                  paramType = sanitizeType(paramTypeNode.text);
                }
              }

              return {
                type: paramType,
                name: paramNameNode ? paramNameNode.text : "Unknown"
              };
            })
>>>>>>> 558c6422c27d3d201a476532d3ee7229115e224e
          : [];

        if (methodNameNode) {
          const visibilityNode = node.namedChildren.find(
            (c) => c.type === "modifiers"
          );
          const visibility = visibilityNode?.text.includes("private")
            ? "-"
            : "+";

          classObj.methods.push({
            visibility,
            name: methodNameNode.text,
<<<<<<< HEAD
            returnType: returnTypeNode?.text || "void",
            parameters,
          });

          const primitiveTypes = [
            "int",
            "double",
            "float",
            "boolean",
            "char",
            "byte",
            "short",
            "long",
            "String",
          ];
          const excludedTypes = ["List", "Set", "Map"];
          parameters.forEach((param) => {
            const containerType = param.type.split("<")[0];
            if (
              !primitiveTypes.includes(param.type) &&
              !excludedTypes.includes(containerType)
            ) {
              relationships.add(
                JSON.stringify({
                  type: "association",
                  from: classObj.name,
                  to: param.type,
                })
              );
=======
            returnType: returnTypeNode ? sanitizeType(returnTypeNode.text) : "void",
            parameters
          });

          const primitiveTypes = ["int", "double", "float", "boolean", "char", "byte", "short", "long", "String"];
          const excludedTypes = ["List", "Set", "Map"];
          parameters.forEach(param => {
            const containerType = param.type.split('<')[0];
            if (!primitiveTypes.includes(param.type) && !excludedTypes.includes(containerType)) {
              relationships.push({
                type: "association",
                from: classObj.name,
                to: sanitizeType(param.type)
              });
>>>>>>> 558c6422c27d3d201a476532d3ee7229115e224e
            }
          });
        }
      }

      traverse(rootNode);

      allClasses = [...allClasses, ...classes];
      allRelationships = [
        ...allRelationships,
        ...Array.from(relationships).map((r) => JSON.parse(r)),
      ];
    });

    // Generate Mermaid code
    let mermaidCode = "classDiagram\n";
    allClasses.forEach((cls) => {
      mermaidCode += `    class ${cls.name} {\n`;
      cls.attributes.forEach((attr) => {
        mermaidCode += `        ${attr.visibility}${attr.name}: ${attr.type}\n`;
      });
      cls.methods.forEach((method) => {
        const params = method.parameters
          .map((param) => `${param.name}: ${param.type}`)
          .join(", ");
        mermaidCode += `        ${method.visibility}${method.name}(${params}): ${method.returnType}\n`;
      });
      mermaidCode += "    }\n";
    });

<<<<<<< HEAD
    allRelationships.forEach((rel) => {
      mermaidCode +=
        rel.type === "inheritance"
          ? `${rel.to} <|-- ${rel.from}\n`
          : `${rel.from} --> ${rel.to}\n`;
=======
    const uniqueRelationships = Array.from(new Set(allRelationships.map(rel => JSON.stringify(rel))))
                                     .map(rel => JSON.parse(rel));

    uniqueRelationships.forEach(rel => {
      if (rel.type === "inheritance") {
        mermaidCode += `${rel.to} <|-- ${rel.from}\n`;
      } else if (rel.type === "association") {
        mermaidCode += `${rel.from} --> ${rel.to}\n`;
      }
>>>>>>> 558c6422c27d3d201a476532d3ee7229115e224e
    });


    return mermaidCode;
  }

  async generateDiagram(parsedProject, projectPath) {
<<<<<<< HEAD
    console.log("Generating class diagram..." + parsedProject);
    console.log(projectPath);
=======
    console.log("Generated Mermaid code:\n", parsedProject);
>>>>>>> 558c6422c27d3d201a476532d3ee7229115e224e
    await this.diagramGenerator.generateDiagram(
      parsedProject,
      projectPath,
      "Class_diagram.png"
    );
  }
}

export default PlotClassDiagram;
