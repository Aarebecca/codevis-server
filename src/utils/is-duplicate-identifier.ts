import type { NodePath } from "@babel/traverse";
/**
 * 1. 使用 Object 解构赋值的变量时，会有两个变量，即key和value
 * 例如
 * const {
 *  a,
 *  b = 1,
 *  c: {
 *    d
 *  },
 *  ...e
 * } = f;
 * 中 a
 * 2. Object 结构时具有默认值的变量
 */
export function isDuplicateIdentifier(nodePath: NodePath): boolean {
  const { node } = nodePath;
  if (
    "range" in node &&
    "extra" in node &&
    node.range === undefined &&
    node.extra === undefined
  ) {
    return true;
  }
  return false;
}
