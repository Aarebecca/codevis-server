import type { NodePath } from "@babel/traverse";
import { comparer } from "./comparer";

/**
 * nodePath 是否为 VariableDefinition
 */
export function isVariableDefinition(
  path: NodePath,
  variableNamesList: string[]
) {
  if (
    path.node.type === "Identifier" &&
    comparer(path.node.name).in(variableNamesList)
  ) {
    let hasId = path.key === "id";
    let hasVariableDeclarator = false;
    let parent = path.parentPath;
    while (parent) {
      if (parent.key === "id") {
        hasId = true;
      }
      if (parent.type === "VariableDeclarator") {
        hasVariableDeclarator = true;
      }
      parent = parent.parentPath;
    }
    return hasId && hasVariableDeclarator;
  }
  return false;
}
