import { AST } from "../ast";
import traverse from "@babel/traverse";
import type { LocNode as Node } from "../types";
import type { LifeCycleData, LifeCycleNode } from "./types";

/**
 * 生成对应代码的 LifeCycleData
 */
export function lifeCycleData(sourceCode: string): LifeCycleData {
  const ast = AST.parse(sourceCode);

  const nodes = (() => {
    const ast: Node[] = [];
    const lifeCycle: LifeCycleData[] = [];
    /**
     * ast 节点转化为 LifeCycleNode
     */
    function createLifeCycleNode(node: Node): LifeCycleData {
      const {
        loc: {
          start: { line: start },
          end: { line: end },
        },
        type,
      } = node;
      return {
        node: {
          start,
          end,
          type,
          loc: {
            start: node.loc.start,
            end: node.loc.end,
          },
        },
        children: [],
      };
    }
    /**
     * 插入节点
     */
    function add(node: Node) {
      const _lifeCycle = createLifeCycleNode(node);
      ast.push(node);
      lifeCycle.push(_lifeCycle);
      return {
        ast: node,
        lifeCycle: _lifeCycle,
      };
    }
    function find(node: Node) {
      const index = ast.indexOf(node);
      if (index === -1) return undefined;
      return {
        ast: ast[index],
        lifeCycle: lifeCycle[index],
      };
    }
    function getByIndex(index: number) {
      return {
        ast: ast[index],
        lifeCycle: lifeCycle[index],
      };
    }

    return {
      add,
      find,
      getByIndex,
    };
  })();

  // const nodes: { astNode: Node; lifeCycleNode: LifeCycleNode }[] = [];

  traverse(ast, {
    enter(path) {
      const node = path.node as Node;
      if (node.type !== "Program") {
        const currNode = nodes.add(node);
        // 查询父节点
        const parent = nodes.find(path.parent as Node);
        if (parent) {
          // 如果父节点存在，则将当前节点插入父节点的 children
          parent.lifeCycle.children.push(currNode.lifeCycle);
        }
      }
    },
  });

  return nodes.getByIndex(0).lifeCycle;
}
