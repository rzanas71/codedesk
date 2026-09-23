// monaco-editor@0.56 exposes these deep paths via its package.json exports
// map ("./*" → "./esm/vs/*.js") but ships no type declarations for them.
declare module "monaco-editor/base/common/errors" {
  export const errorHandler: {
    unexpectedErrorHandler: (e: unknown) => void;
    onUnexpectedError(e: unknown): void;
    emit(e: unknown): void;
  };
  export function onUnexpectedError(e: unknown): void;
}
