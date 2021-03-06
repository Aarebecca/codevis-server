import { parse } from "@babel/parser";
import {
  extractIdentifierRestElementPattern,
  extractVariables,
  extractVariableNames,
  extractVariableNamesList,
  extractArgumentNames,
  extractArgumentNamesList,
  extractVariableNamesWithLoc,
} from "../../../src/ast/extract";
import { AST } from "../../../src/ast";

describe("Extract", () => {
  it("Identifier", () => {
    const ast = parse(`function a(){ let i = 10 }`);
    // @ts-ignore
    const pattern = ast.program.body[0].body.body[0].declarations[0].id;
    expect(extractIdentifierRestElementPattern(pattern)).toEqual("i");
  });

  it("extractObjectPattern", () => {
    const ast = parse(
      `function a(z){let {a, b: {c}, d:{e:{F: [g, h, i]}},...rest} = obj;}`
    );
    // @ts-ignore
    const pattern = ast.program.body[0].body.body[0].declarations[0].id;
    expect(extractIdentifierRestElementPattern(pattern)).toStrictEqual({
      a: "Identifier",
      b: { c: "Identifier" },
      d: { e: { F: ["g", "h", "i"] } },
      rest: "RestElement",
    });
  });

  it("extractArrayPattern", () => {
    const ast = parse(`
    function a(z){ let [, b0, b=1, [c], {d: [f, {h}]},...rest] = obj;}
    `);
    // @ts-ignore
    const pattern = ast.program.body[0].body.body[0].declarations[0].id;
    expect(extractIdentifierRestElementPattern(pattern)).toStrictEqual([
      ,
      "b0",
      "b",
      ["c"],
      { d: ["f", { h: "Identifier" }] },
      "...rest", // 在 ArrayPattern 中，RestElement 需要在名字前标识 ...
    ]);
  });

  it("extractVariables", () => {
    let { functions } = new AST(`
    function a(z){ 
      let [, b=1,...rest] = obj;
      let i = 2;
      let {j, k: {l}} = obj;
    }
    `);
    expect(extractVariables(functions[0]).length).toBe(3);
    let names = extractVariableNames(functions[0]);
    expect(names.length).toBe(3);
    let [v0, v1, v2] = names;

    expect(v0).toStrictEqual([[, "b", "...rest"]]);
    expect(v1).toStrictEqual(["i"]);
    expect(v2).toStrictEqual([{ j: "Identifier", k: { l: "Identifier" } }]);

    functions = new AST(`
    const a = (z) => { 
      let [, b=1,...rest] = obj;
      let i = 2;
      let {j, k: {l}} = obj;
    }
    `).functions;

    expect(extractVariables(functions[0]).length).toBe(3);
    names = extractVariableNames(functions[0]);
    expect(names.length).toBe(3);
    [v0, v1, v2] = names;

    expect(v0).toStrictEqual([[, "b", "...rest"]]);
    expect(v1).toStrictEqual(["i"]);
    expect(v2).toStrictEqual([{ j: "Identifier", k: { l: "Identifier" } }]);

    functions = new AST(`
      a = new Function('{let [, b=1,...rest] = obj;let i = 2;let {j, k: {l}} = obj;}')
    `).functions;

    expect(extractVariables(functions[0]).length).toBe(3);
    names = extractVariableNames(functions[0]);
    expect(names.length).toBe(3);
    [v0, v1, v2] = names;

    expect(v0).toStrictEqual([[, "b", "...rest"]]);
    expect(v1).toStrictEqual(["i"]);
    expect(v2).toStrictEqual([{ j: "Identifier", k: { l: "Identifier" } }]);
  });

  it("extractVariableNamesList", () => {
    const { functions } = new AST(`
    function a(z){ 
      let [, b=1,...rest1] = obj;
      let i = 2;
      let {j, k: {l, ...rest2}} = obj;
    }
    `);
    const variableNamesList = extractVariableNamesList(functions[0]);
    expect(variableNamesList).toStrictEqual([
      "b",
      "...rest1",
      "i",
      "j",
      "l",
      "...rest2",
    ]);

    expect(
      extractVariableNamesList(
        new AST(`function f(node) {
      const list = [node];
      const a = 1;
      const [b, , h=2, [j],...c] = o;
      const {d, e, g=1, k:{z},...f} = k2;
      let [path, ...rest] = node.parentPath;
      while (path) {
        list.unshift(path);
        path = path.parentPath;
      }
      return list;
    }`).functions[0]
      )
    ).toStrictEqual([
      "list",
      "a",
      "b",
      "h",
      "j",
      "...c",
      "d",
      "e",
      "g",
      "z",
      "...f",
      "path",
      "...rest",
    ]);
  });

  it("extractArgumentNames", () => {
    const { functions } = new AST(
      `function a(b, b1=1, [, c, ...rest0], {d, ...rest1}, ...rest2){ }`
    );
    const argumentNames = extractArgumentNames(functions[0]);
    expect(argumentNames.length).toStrictEqual(5);
    expect(argumentNames[0]).toStrictEqual("b");
    expect(argumentNames[1]).toStrictEqual("b1");
    expect(argumentNames[2]).toStrictEqual([, "c", "...rest0"]);
    expect(argumentNames[3]).toStrictEqual({
      d: "Identifier",
      rest1: "RestElement",
    });
    expect(argumentNames[4]).toStrictEqual("...rest2");
  });

  it("extractArgumentNamesList", () => {
    const { functions } = new AST(
      `function a(b , b1 = 1, [, c, ...rest0], {d, ...rest1}, ...rest2){ }`
    );
    const argumentNamesList = extractArgumentNamesList(functions[0]);
    expect(argumentNamesList).toStrictEqual([
      "b",
      "b1",
      "c",
      "...rest0",
      "d",
      "...rest1",
      "...rest2",
    ]);
  });

  it("extractVariableNamesWithLoc", () => {
    let code = `function f(node) {
      const list = [node];
      const a = 1;
      const [b, , h=2, [j],...c] = o;
      const {d, e, g=1, k:{z},...f} = k2;
      let [path, ...rest] = node.parentPath;
      let [pa, ...re] = path;
      while (path) {
        list.unshift(path);
        path = path.parentPath;
      }
      return list;
    }`;
    const ast = new AST(code);
    const { normalizeIdentifierFunctions } = ast;
    const f = normalizeIdentifierFunctions[0];
    // console.log(AST.generate(ast.functions[0], {}, false));
    const locList = extractVariableNamesWithLoc(f);
    const res = {
      list: 2,
      a: 3,
      b: 4,
      h: 4,
      j: 4,
      c: 4,
      d: 5,
      e: 5,
      g: 5,
      z: 5,
      f: 5,
      path: 6,
      rest: 6,
      pa: 7,
      re: 7,
    } as const;
    // locList.forEach(({ name, loc: [line1] }) => {
    //   expect(res[name as keyof typeof res]).toBe(line1);
    // });
  });

  it("extractVariableNamesWithLoc2", () => {
    const code = `function f(m, exports) {
      for (var p in m)
        if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p))
          __createBinding(exports, m, p);
    }
    `;
    const ast = new AST(code);
    const { normalizeIdentifierFunctions } = ast;
    const f = normalizeIdentifierFunctions[0];
    const locList = extractVariableNamesWithLoc(f);
    console.log(AST.generate(f, {}));
    console.log(locList);
  });
});
