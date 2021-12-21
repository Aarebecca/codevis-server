# Usage

## AST

**Init**

```js
const code = `
function f(){
  return true
}
`;
const ast = new AST(code);
```

**Parse** => _@babel/types/File_ [static]

> AST.parse(code);

**Get code string** => _string_

> ast.code

**Get functions list in the code** => _FunctionNode[]_

> ast.functions

**Get functions which are not being minified or has variables** => _FunctionNode[]_

> ast.availableFunctions

**Get available functions whose variable names are normalized with camel** => _FunctionNode[]_

> ast.normalizeIdentifierFunctions

**Convert abstract syntax tree to parent-children form** => Tree

> ast.identifierTree()

**Replace the code with new string or File**

> ast.reload(newCode)
