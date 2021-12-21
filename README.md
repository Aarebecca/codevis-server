# Usage

## Start Service

> npm run start

## Config log file

> setting in the `src/log.ts`

## API

**`/`**
> Will show `Server is running` when service start success.

**function-list** *file*
> Parse code and return the function definitions in the code text.

**var-list** *code*
> Parse code of function definition and return all variables with the location where them were.

**var-flow** *code*, *mixer*, *nodeColor*
> Generate code heat map data according to the code text, mixer and custom color config.
