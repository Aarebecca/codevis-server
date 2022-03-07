import type {
  FunctionDeclaration,
  FunctionExpression,
  ArrowFunctionExpression,
  SourceLocation,
  Node,
} from "@babel/types";

export type FunctionNode =
  | FunctionDeclaration
  | FunctionExpression
  | ArrowFunctionExpression;

export type AnyObject<T = string> = {
  [keys: string]: T;
};

export type Tree = {
  children: Tree[];
  [key: string]: any;
};

export type LocNode = Node & {
  loc: SourceLocation;
};
