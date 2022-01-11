import traverse from "@babel/traverse";
import generate from "@babel/generator";
import { parse } from "@babel/parser";
import { isDuplicateIdentifier } from "../utils";
import { get, isArray, isString } from "lodash";
import type { NodePath } from "@babel/traverse";
import type { Tree } from "../types";
import type { File, Identifier } from "@babel/types";

export type TTree<T> = Tree & {
  node?: T;
  parent?: TTree<T>;
  children?: TTree<T>[];
};

export interface IdentifierTreeStructure extends Omit<TTree<NodePath>, "node"> {
  nodePath?: NodePath;
}

export interface IdentifierTreeAttr {
  value: string | File;
  identifierFilter?: string[] | string; // 对 identifier 名字（筛选所需标识符）
  excludeType?: string[] | string; // 排除的节点类型（statement）
  includeType?: string[] | string; // 包含的节点类型 (includeType 和 excludeType 应当只存在一个)
}

export class IdentifierTree {
  private code: string;
  private ast: File;
  private _identifierFilter: string[] | undefined;
  private _excludeType: string[] | undefined;
  private _includeType: string[] | undefined;

  /**
   *
   * @param value 代码或 ast
   * @param identifierFilter Identifier 过滤选项
   * @param excludeType 排除的 Type
   * @param includeType 包含的 Type (excludeType 和 includeType 应当只存在一个)
   */
  constructor(
    value: IdentifierTreeAttr["value"],
    identifierFilter?: IdentifierTreeAttr["identifierFilter"],
    excludeType?: IdentifierTreeAttr["excludeType"],
    includeType?: IdentifierTreeAttr["includeType"]
  ) {
    if (isString(value)) {
      this.code = value;
      this.ast = parse(value);
    } else {
      this.code = generate(value).code;
      this.ast = value;
    }
    if (identifierFilter) this.identifierFilter = identifierFilter;
    if (excludeType) this.excludeType = excludeType;
    if (includeType) this.includeType = includeType;
  }

  set identifierFilter(value: string | string[]) {
    this._identifierFilter = isString(value) ? [value] : value;
  }

  set excludeType(value: string | string[]) {
    this._excludeType = isString(value) ? [value] : value;
  }

  set includeType(value: string | string[]) {
    this._includeType = isString(value) ? [value] : value;
  }

  /**
   * Identifier 节点
   */
  get identifierNodes() {
    const nodes: NodePath<Identifier>[] = [];
    const { _identifierFilter } = this;
    traverse(this.ast, {
      Identifier(path) {
        if (isDuplicateIdentifier(path)) return;
        if (!_identifierFilter || _identifierFilter.includes(path.node.name)) {
          nodes.push(path);
        }
      },
    });
    return nodes;
  }

  /**
   * 将 Identifier 节点转换从根节点到其的路径
   */
  get paths() {
    return Array.from(this.identifierNodes, (nodePath) => {
      const path: NodePath[] = [nodePath];
      let parent: NodePath | null = nodePath.parentPath;
      while (parent) {
        /**
         * 设置为 includeType 模式，则只包含 includeType 类型的节点
         * 设置为 excludeType 模式，则排除 excludeType 类型的节点
         * 如果都没设置则添加全部节点
         */
        if (
          (this._includeType && this._includeType.includes(parent.node.type)) ||
          !this._excludeType ||
          !this._excludeType.includes(parent.node.type)
        ) {
          path.unshift(parent);
        }
        parent = parent.parentPath;
      }
      return path;
    });
  }

  /**
   * 生成的 Identifier 节点树
   */
  get tree() {
    const _t: IdentifierTreeStructure = {
      children: [],
    };
    this.paths.forEach((path) => {
      let currNode = _t;
      let children = _t.children as IdentifierTreeStructure[];
      path.forEach((nodePath) => {
        const idx = children.findIndex((child) => child.nodePath === nodePath);
        if (idx === -1) {
          const child: IdentifierTreeStructure = {
            nodePath,
            parent: currNode,
            children: [],
          };
          children.push(child);
          currNode = child;
        } else {
          currNode = children[idx];
        }
        children = currNode.children;
      });
    });

    return _t;
  }

  public summary(
    getter: (node: IdentifierTreeStructure) => any = (node) =>
      get(node, "nodePath.node.name", "")
  ) {
    const { tree } = this;
    const _ = (t: IdentifierTreeStructure) => {
      if (t.children.length === 0) {
        return getter(t);
      }
      return t.children.map(_);
    };
    let _t = _(tree);
    while (isArray(_t) && _t.length === 1) {
      _t = _t[0];
    }
    return _t;
  }
}
