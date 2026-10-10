import { writeFile } from "node:fs/promises";

/** Capture the real routing compiler during a Node build, then emit ordinary static JS functions. */
export async function precompilePublicApi(file: string): Promise<void> {
  const original = globalThis.Function;
  const functions = new Map<string, string[]>();
  globalThis.Function = new Proxy(original, {
    construct(target, args: string[]) {
      functions.set(JSON.stringify(args), args);
      return Reflect.construct(target, args);
    },
  });
  try {
    const { buildPublicApi } = await import("./public-api.ts");
    const app = buildPublicApi();
    await app.ready();
    await app.close();
  } finally { globalThis.Function = original; }
  const entries = [...functions].map(([key, args]) => `${JSON.stringify(key)}: function(${args.slice(0, -1).join(",")}) {${args.at(-1)}}`);
  await writeFile(file, `const compiled = {${entries.join(",\n")}};\nexport function compileStaticFunction(...args) { const fn = compiled[JSON.stringify(args)]; if (!fn) throw new Error("API compiler input changed; rebuild the Cloudflare deployment."); return fn; }\n`);
  console.log(`Precompiled ${functions.size} routing/serialization functions; no runtime eval enabled.`);
}
