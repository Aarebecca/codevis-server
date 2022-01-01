import { camelCase, isString } from "lodash";
import generate from "@babel/generator";
import traverse from "@babel/traverse";
import { comparer } from "../utils/comparer";
import { extractArgumentNamesList, extractVariableNamesList } from "./extract";
import { isFunctionAvailable } from "./drop";
import { parse } from "@babel/parser";
import prettier from "prettier";
import * as t from "@babel/types";
/** G
 * 抽象语法树 ast 的解析及函数定义提取
 */
import type { Tree, FunctionNode } from "../types";
import type {
  File as AST_TYPE,
  StringLiteral,
  Node,
  FunctionExpression,
  ExpressionStatement,
} from "@babel/types";

import type { NodePath } from "@babel/traverse";

export * from "./drop";
export * from "./extract";

interface IdentifierTree extends Tree {
  node?: NodePath;
  parent?: IdentifierTree;
  children: IdentifierTree[];
}

export class AST {
  public raw: string;
  public ast!: AST_TYPE;

  constructor(code: string | AST_TYPE) {
    this.raw = isString(code) ? code : AST.generate(code);
    this.reload(code);
  }

  /**
   * 解析代码为 ast
   */
  public static parse(code: string): AST_TYPE {
    try {
      return parse(code);
    } catch (es) {
      // try parse as module
      try {
        return parse(code, {
          sourceType: "module",
          plugins: ["jsx", "flow"],
        });
      } catch (em) {
        throw new Error(`parse error: ${em}`);
      }
    }
  }

  public static generate(
    code: Node,
    options = {},
    isPrettier: boolean = false
  ) {
    const resCode = generate(code, options).code;
    return isPrettier
      ? prettier.format(resCode, { parser: "typescript" })
      : resCode;
  }

  /**
   * code string
   */
  public get code() {
    return generate(this.ast);
  }

  /**
   * 获得 ast 中所有的函数定义节点
   * 包括函数声明、函数表达式、箭头函数
   */
  public get functions(): FunctionNode[] {
    const funcs: FunctionNode[] = [];

    traverse(this.ast, {
      FunctionDeclaration({ node }) {
        funcs.push(node);
      },
      FunctionExpression({ node }) {
        // add function name to node
        if (!node.id) {
          node.id = t.identifier("f");
        }

        funcs.push(node);
      },
      ArrowFunctionExpression({ node }) {
        funcs.push(node);
      },
      NewExpression({ node }) {
        // 针对 new Function 定义的函数
        if (
          node.type === "NewExpression" &&
          node.callee.type === "Identifier" &&
          node.callee.name === "Function"
        ) {
          const params = node.arguments
            .slice(0, -1)
            .map((arg) => (arg as StringLiteral).value);
          const f = `(function (${params.join(",")}){ ${
            (node.arguments.slice(-1)[0] as StringLiteral).value
          } })`;
          funcs.push(
            (AST.parse(f).program.body[0] as ExpressionStatement)
              .expression as FunctionExpression
          );
        }
      },
    });

    return funcs;
  }

  /**
   * 获得可用的function
   */
  public get availableFunctions() {
    return this.functions.filter(isFunctionAvailable);
  }

  /**
   * 代码规范化
   */
  public get normalizeIdentifierFunctions() {
    /**
     * 命名使用驼峰法
     */
    // const { availableFunctions: functions } = this;
    const { functions } = this;
    return functions.map((func) => {
      const list = [
        ...extractArgumentNamesList(func),
        ...extractVariableNamesList(func),
      ];

      const f = AST.parse(AST.generate(func));
      traverse(f, {
        Identifier(path) {
          const { node } = path;
          const cpr = comparer(node.name);
          if (cpr.in(list)) {
            node.name = camelCase(cpr.val);
          }
        },
      });

      return f.program.body[0] as FunctionNode;
    });
  }

  /**
   * 将抽象语法树转化为与 Identifier 相关的tree
   */
  public identifierTree(filter?: string | []): IdentifierTree {
    const ast = AST.parse(this.raw);
    /**
     * identifier 节点
     */
    const filterPattern = filter
      ? isString(filter)
        ? [filter]
        : filter
      : undefined;

    const identifierNodes: NodePath[] = [];
    traverse(ast, {
      Identifier(path) {
        if (!filterPattern) {
          identifierNodes.push(path);
        } else if (filterPattern.includes(path.node.name)) {
          identifierNodes.push(path);
        }
      },
    });

    const nodesList = Array.from(identifierNodes, function (node) {
      const list = [node];
      let path = node.parentPath;
      while (path) {
        list.unshift(path);
        path = path.parentPath;
      }

      return list;
    });

    const tree: IdentifierTree = {
      children: [],
    };

    nodesList.forEach((node) => {
      let currNode = tree;
      let children = tree.children;
      node.forEach((path) => {
        const idx = children.findIndex(({ node }) => {
          return node === path;
        });
        if (idx === -1) {
          const newPath: IdentifierTree = {
            node: path,
            parent: currNode,
            children: [],
          };
          children.push(newPath);
          currNode = newPath;
        } else {
          currNode = children[idx];
        }
        children = currNode.children;
      });
    });

    return tree;
  }

  /**
   * 重新载入 this.ast
   */
  private reload(code: string | AST_TYPE) {
    this.ast = typeof code === "string" ? AST.parse(code) : code;
  }
}
