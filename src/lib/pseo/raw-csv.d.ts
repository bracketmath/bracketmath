/**
 * Vite `?raw` import shim — lets TypeScript accept `import csv from '...csv?raw'`
 * (Vite resolves this at build time to a JS string containing the file's contents).
 */
declare module '*.csv?raw' {
  const content: string;
  export default content;
}
