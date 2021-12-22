export function babelLoc2VSLoc({
  line,
  column,
}: {
  line: number;
  column: number;
}) {
  return {
    line,
    column: column + 1,
  };
}
