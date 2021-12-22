import { SourceLocation } from "@babel/types";

export type CodeColor = {
  type: string;
  color: string;
  loc: SourceLocation;
};

export type RangeClassColor = {
  range: [number, number, number, number];
  color: string;
  type: string[];
};
