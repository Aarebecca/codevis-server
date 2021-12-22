import type { NodePath } from "@babel/traverse";
import { comparer } from "./comparer";
import { isVariableDefinition } from ".";

export function isVariableMention(
  path: NodePath,
  variableNamesList: string[]
): boolean {
  if (
    path.node.type === "Identifier" &&
    comparer(path.node.name).in(variableNamesList) &&
    !isVariableDefinition(path, variableNamesList)
  ) {
    return true;
  }
  return false;
}
