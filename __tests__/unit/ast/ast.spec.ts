import type {
  Identifier,
  FunctionDeclaration,
  FunctionExpression,
  ArrowFunctionExpression,
} from "@babel/types";
import {
  extractArgumentNamesList,
  extractVariableNamesList,
} from "../../../src/ast/extract";
import { AST } from "../../../src/ast";

describe("ast", () => {
  let ast: AST;

  const code = `
    'use strict'
    const zeroEks = require('../')
    const { join } = require('path')
    function a(z) {
      let b = function () {
        let c = 1;
      };
      let d = () => {
        let e = 2;
      };
      let f = new Function("{let g = 2;}");
      function h() {}
    }    
    `;

  it("init", () => {
    ast = new AST(code);
    expect(ast.ast.type).toBe("File");
  });

  it("generate", () => {
    const code1 = `let a = 1;`;
    expect(AST.generate(AST.parse(code1))).toBe(code1);
  });

  it("functions", () => {
    const { functions } = ast;
    expect(functions.length).toBe(5);
    const [f0, f1, f2, f3, f4] = functions;
    expect(((f0 as FunctionDeclaration).id as Identifier).name).toBe("a");
    expect((f0 as FunctionDeclaration).type).toBe("FunctionDeclaration");
    expect((f0 as FunctionDeclaration).params.length).toBe(1);

    expect((f1 as FunctionExpression).type).toBe("FunctionExpression");
    expect((f2 as ArrowFunctionExpression).type).toBe(
      "ArrowFunctionExpression"
    );

    expect((f3 as FunctionExpression).type).toBe("FunctionExpression");
    expect((f4 as FunctionDeclaration).type).toBe("FunctionDeclaration");
  });

  it("functions2", () => {
    ast = new AST(`
    // 1
    function a(){};
    // 2
    function b(param){};
    // 3
    (function c(){})();
    // 4
    () =>{ };
    // 5
    d = ()=>{ };
    // 6
    e = (param) => retVal;
    // 7
    (()=>{})()
    // 8
    new Function('{return 0}')
    // 9
    new Function('a', 'b', '{return a+b}')
    `);
    const { functions } = ast;
    expect(functions.length).toBe(9);
  });

  it("functions3", () => {
    ast = new AST(`
    (function(o, m, k, k2) {
      if (k2 === undefined) k2 = k;
      o[k2] = m[k];
    })()`);
    const { functions } = ast;
    expect(functions.length).toBe(1);
  });

  it("availableFunctions", () => {
    ast = new AST(`
    function a(){
      // invalid
    }
    function valid(parameter = 1){
      let variable = 1;
    }
    function b(){
      let c = 1;
      const d = 3;
    }
    function valid_c(){
      let variable_1 = 1;
      let variable_2 = 2;
      let variable_3 = 3;
    }
    `);
    const { availableFunctions } = ast;
    expect(availableFunctions.length).toBe(3);
    const [f0, f1] = availableFunctions;
    expect(((f0 as FunctionDeclaration).id as Identifier).name).toBe("valid");
    expect(((f1 as FunctionDeclaration).id as Identifier).name).toBe("b");
  });

  it("availableFunctions2", () => {
    const { availableFunctions } = new AST(`
    function a(z){
      let [, b=1,...rest] = obj;
      let i = 2;
      let {j, k: {l}} = obj;
    }
    function aa(z){
      let [, b=1,...rest] = obj;
      let i = 2;
      let {j, k: {l}} = obj;
    }
    function aaron(zero){
      let [, bob=1,...rest] = obj;
      let inter = 2;
      let {job, keep: {lay}} = obj;
    }
    const c = ()=>{
      let [, bob=1,...rest] = obj;
      let inter = 2;
      let {job, keep: {lay}} = obj;
    }
    const d = new Function('param', 'let [, bob=1,...rest] = obj;')
    `);
    expect(availableFunctions.length).toBe(5);
    const [f0, , , f3, f4] = availableFunctions as [
      FunctionDeclaration,
      FunctionDeclaration,
      FunctionDeclaration,
      ArrowFunctionExpression,
      FunctionExpression
    ];

    expect(f0.type).toBe("FunctionDeclaration");
    expect(f0.id!.name).toBe("a");

    expect(f3.type).toBe("ArrowFunctionExpression");
    expect(f4.type).toBe("FunctionExpression");
  });

  it("normalizeIdentifierFunctions", () => {
    ast = new AST(`
      function invalidF(){
        
      }
      function f1(PARA_METER=1){
        let variableName1 = 1;
        const variableName2 = 2;
        let VARIABLE_NAME_3 = 3;
        return VARIABLE_NAME_3;
      }
    `);
    const {
      normalizeIdentifierFunctions: [f0, f1],
    } = ast;

    const af1 = extractArgumentNamesList(f1);
    const vf1 = extractVariableNamesList(f1);

    expect(af1).toStrictEqual(["paraMeter"]);
    expect(vf1).toStrictEqual([
      "variableName1",
      "variableName2",
      "variableName3",
    ]);
    expect(AST.generate(f1)).toBe(
      `function f1(paraMeter = 1) {
  let variableName1 = 1;
  const variableName2 = 2;
  let variableName3 = 3;
  return variableName3;
}`
    );
  });
});
