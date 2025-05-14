import Parser from "tree-sitter";
import Java from "tree-sitter-java";
import PlottingAction from "./plottingAction.js";

class PlotClassDiagram extends PlottingAction {
  constructor(diagramGenerator, fileManager) {
    super(diagramGenerator, fileManager);
    this.parser = new Parser();
    this.parser.setLanguage(Java);
    this.userDefinedClasses = new Set();
    this.enums = new Set();
  }

  removeImports(code) {
    return typeof code === 'string'
      ? code.replace(/^import.*;/gm, '')
      : '';
  }

  parseProject(projectJSON) {
    const classes = [];
    if (!Array.isArray(projectJSON)) return [];

    for (const file of projectJSON) {
      if (!file?.filePath || typeof file.content !== 'string') {
        console.warn("[parseProject] Skipping invalid file:", file);
        continue;
      }

      try {
        const cleanedCode = this.removeImports(file.content);
        const tree = this.parser.parse(cleanedCode);
        const root = tree.rootNode;

        const classNodes = root.descendantsOfType("class_declaration");
        const interfaceNodes = root.descendantsOfType("interface_declaration");
        const enumNodes = root.descendantsOfType("enum_declaration");

        for (const classNode of classNodes) {
          const className = classNode.childForFieldName("name")?.text;
          if (className) this.userDefinedClasses.add(className);
        }

        for (const interfaceNode of interfaceNodes) {
          const interfaceName = interfaceNode.childForFieldName("name")?.text;
          if (interfaceName) this.userDefinedClasses.add(interfaceName);
        }

        for (const enumNode of enumNodes) {
          const enumName = enumNode.childForFieldName("name")?.text;
          if (enumName) this.enums.add(enumName);
        }

      } catch (err) {
        console.error(`[parseProject] Pass 1 error in ${file.filePath}:`, err);
      }
    }

    for (const file of projectJSON) {
      try {
        const cleanedCode = this.removeImports(file.content);
        const tree = this.parser.parse(cleanedCode);
        const root = tree.rootNode;

        for (const enumNode of root.descendantsOfType("enum_declaration")) {
          const enumName = enumNode.childForFieldName("name")?.text;
          if (!enumName) continue;

          const enumBody = enumNode.childForFieldName("body");
          const enumValues = [];

          if (enumBody) {
            for (const child of enumBody.namedChildren) {
              if (child.type === "enum_constant") {
                enumValues.push(child.text);
              }
            }
          }

          classes.push({
            className: enumName,
            attributes: enumValues,
            methods: [],
            extendsClass: null,
            implementsInterfaces: [],
            associations: [],
            dependencies: [],
            file: file.filePath,
            isEnum: true
          });
        }

        for (const classNode of root.descendantsOfType("class_declaration")) {
          const className = classNode.childForFieldName("name")?.text || "UnknownClass";

          const bodyNode = classNode.childForFieldName("body");
          const attributes = [];
          const methods = [];
          let extendsClass = null;
          const implementsInterfaces = [];
          const associations = new Set();
          const dependencies = new Set();

          if (bodyNode) {
            for (const member of bodyNode.namedChildren) {
              if (member.type === "field_declaration") {
                const typeNode = member.childForFieldName("type");
                const attrType = typeNode?.text;
                const varDecls = member.descendantsOfType("variable_declarator");

                for (const varDecl of varDecls) {
                  const attrName = varDecl.childForFieldName("name")?.text;
                  if (attrName && attrType) {
                    attributes.push(`${attrName}: ${attrType}`);
                    const innerTypes = this.extractClassTypeFromCollection(attrType);
                    innerTypes.forEach(inner => associations.add(inner));
                    associations.add(attrType);
                  }
                }
              }

              if (member.type === "method_declaration") {
                const methodName = member.childForFieldName("name")?.text || "UnknownMethod";
                const methodParams = member.descendantsOfType("formal_parameter");
                let returnType = member.childForFieldName("type")?.text || "void";

                // ---- SKIP SETTER ----
                if (methodName.startsWith("set")) continue;

                // ---- SKIP SIMPLE GETTER ----
                if ((methodName.startsWith("get") || methodName.startsWith("get")) && this.isSimpleGetter(member)) {
                  console.log(`Skipping simple getter: ${methodName}`);
                  continue;
                }

                methods.push(`${methodName}(${methodParams.map(param => {
                  const paramName = param.childForFieldName("name")?.text || "arg";
                  const paramType = param.childForFieldName("type")?.text || "UnknownType";
                  return `${paramName}: ${paramType}`;
                }).join(', ')}) : ${returnType}`);

                methodParams.forEach(param => {
                  const paramType = param.childForFieldName("type")?.text;
                  if (paramType) {
                    const innerTypes = this.extractClassTypeFromCollection(paramType);
                    innerTypes.forEach(inner => dependencies.add(inner));
                    dependencies.add(paramType);
                  }
                });

                const innerReturnTypes = this.extractClassTypeFromCollection(returnType);
                innerReturnTypes.forEach(inner => dependencies.add(inner));
                dependencies.add(returnType);

                const methodBody = member.childForFieldName("body");
                if (methodBody) {
                  const objectCreations = methodBody.descendantsOfType("object_creation_expression");
                  for (const obj of objectCreations) {
                    const typeNode = obj.childForFieldName("type");
                    const typeName = typeNode?.text;
                    if (typeName && this.userDefinedClasses.has(typeName)) {
                      dependencies.add(typeName);
                    }
                  }

                  const identifiers = methodBody.descendantsOfType("identifier");
                  for (const id of identifiers) {
                    if (id.text && this.userDefinedClasses.has(id.text)) {
                      dependencies.add(id.text);
                    }
                  }
                }
              }
            }

            const extendsNode = classNode.childForFieldName("superclass");
            if (extendsNode) {
              extendsClass = extendsNode.text.split(" ")[1];
            }

            const implementsNode = classNode.childForFieldName("interfaces");
            if (implementsNode) {
              const interfaceTypes = implementsNode.descendantsOfType("type_identifier");
              interfaceTypes.forEach(interfaceNode => {
                const interfaceName = interfaceNode.text.trim();
                if (interfaceName) {
                  implementsInterfaces.push(interfaceName);
                }
              });

              if (implementsInterfaces.length === 0 && implementsNode.text.trim()) {
                const directInterfaces = implementsNode.text.trim().split(/\s+/);
                directInterfaces.forEach(interfaceName => {
                  if (interfaceName) implementsInterfaces.push(interfaceName);
                });
              }
            }

            classes.push({
              className,
              attributes,
              methods,
              extendsClass,
              implementsInterfaces,
              associations: Array.from(associations).filter(assoc =>
                this.userDefinedClasses.has(assoc) || this.enums.has(assoc)
              ),
              dependencies: Array.from(dependencies).filter(dep =>
                this.userDefinedClasses.has(dep) || this.enums.has(dep)
              ),
              file: file.filePath,
              isEnum: false
            });
          }
        }

        for (const interfaceNode of root.descendantsOfType("interface_declaration")) {
          const interfaceName = interfaceNode.childForFieldName("name")?.text || "UnknownInterface";
          const bodyNode = interfaceNode.childForFieldName("body");
          const methods = [];

          if (bodyNode) {
            for (const member of bodyNode.namedChildren) {
              if (member.type === "method_declaration") {
                const methodName = member.childForFieldName("name")?.text || "UnknownMethod";
                const methodParams = member.descendantsOfType("formal_parameter");
                const returnType = member.childForFieldName("type")?.text || "void";

                methods.push(`${methodName}(${methodParams.map(param => {
                  const paramName = param.childForFieldName("name")?.text || "arg";
                  const paramType = param.childForFieldName("type")?.text || "UnknownType";
                  return `${paramName}: ${paramType}`;
                }).join(', ')}) : ${returnType}`);
              }
            }
          }

          classes.push({
            className: interfaceName,
            attributes: [],
            methods,
            extendsClass: null,
            implementsInterfaces: [],
            associations: [],
            dependencies: [],
            file: file.filePath,
            isEnum: false,
            isInterface: true
          });
        }

      } catch (err) {
        console.error(`[parseProject] Pass 2 error in ${file.filePath}:`, err);
      }
    }

    return classes;
  }

  isSimpleGetter(methodNode) {
    const methodBody = methodNode.childForFieldName("body");
    if (!methodBody || methodBody.namedChildren.length !== 1) return false;

    const onlyStmt = methodBody.namedChildren[0];
    if (onlyStmt.type !== "return_statement") return false;

    const expr = onlyStmt.namedChildren[0];
    return expr?.type === "identifier";
  }

  isClassType(type) {
    const primitiveTypes = ["int", "double", "boolean", "char", "float", "long", "short", "byte", "void"];
    const standardTypes = ["String", "List", "ArrayList", "Map", "Set", "HashMap", "LinkedList"];
    return type && !primitiveTypes.includes(type) && !standardTypes.includes(type) && !this.enums.has(type);
  }

  isUserDefinedClass(type) {
    return this.userDefinedClasses.has(type);
  }

  extractClassTypeFromCollection(type) {
    const matches = [...type.matchAll(/<([^>]+)>/g)];
    const innerTypes = new Set();

    for (const match of matches) {
      const parts = match[1].split(',').map(t => t.trim());
      parts.forEach(part => {
        if (part && this.isClassType(part)) {
          innerTypes.add(part);
        }
      });
    }

    return Array.from(innerTypes);
  }

  async generateDiagram(parsedClasses, projectPath) {
    if (!Array.isArray(parsedClasses) || parsedClasses.length === 0) {
      console.warn("[generateDiagram] No parsed classes provided.");
      return;
    }

    let mermaidSyntax = "classDiagram\n";

    for (const cls of parsedClasses) {
      if (cls.isEnum) {
        mermaidSyntax += `class ${cls.className} {\n  <<enumeration>>\n`;
        for (const val of cls.attributes) {
          mermaidSyntax += `  ${val}\n`;
        }
        mermaidSyntax += "}\n";
        continue;
      }

      if (cls.isInterface) {
        mermaidSyntax += `class ${cls.className} {\n  <<interface>>\n`;
        for (const method of cls.methods) {
          mermaidSyntax += `  +${method}\n`;
        }
        mermaidSyntax += "}\n";
        continue;
      }

      mermaidSyntax += `class ${cls.className} {\n`;
      for (const attr of cls.attributes) {
        mermaidSyntax += `  +${attr}\n`;
      }
      for (const method of cls.methods) {
        mermaidSyntax += `  +${method}\n`;
      }
      mermaidSyntax += "}\n";
    }

    for (const cls of parsedClasses) {
      if (cls.extendsClass && this.userDefinedClasses.has(cls.extendsClass)) {
        const extendedClass = cls.extendsClass.split(" ")[1] || cls.extendsClass;
        mermaidSyntax += `${extendedClass} <|-- ${cls.className}\n`;
      }

      cls.implementsInterfaces
        .filter(impl => this.userDefinedClasses.has(impl))
        .forEach(impl => {
          mermaidSyntax += `${impl} <|.. ${cls.className} : implements\n`;
        });

      cls.associations.forEach(assoc => {
        mermaidSyntax += `${cls.className} --> ${assoc}\n`;
      });

      cls.dependencies.forEach(dep => {
        if (!cls.associations.includes(dep)) {
          mermaidSyntax += `${cls.className} ..> ${dep}\n`;
        }
      });
    }

    try {
      const fileName = "classDiagram.svg";
      return await this.diagramGenerator.generateDiagram(
        mermaidSyntax,
        projectPath,
        fileName
      );
    } catch (err) {
      console.error("[generateDiagram] Failed to generate diagram:", err);
    }
  }
}

export default PlotClassDiagram;
