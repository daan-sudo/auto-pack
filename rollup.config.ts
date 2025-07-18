import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import dts from "rollup-plugin-dts";
import json from "@rollup/plugin-json";
import { defineConfig } from "rollup";

const input = "src/index.ts";

export default defineConfig([
  {
    input,
    output: [
      { file: "dist/index.esm.js", format: "esm" },
      { file: "dist/index.cjs", format: "cjs", exports: "auto" },
    ],
    plugins: [
      nodeResolve(),
      commonjs(),
      json(),
      typescript({ tsconfig: "./tsconfig.json", declaration: true }),
    ],
    external: ["shelljs"],
  },
  {
    input,
    output: {
      file: "dist/index.d.ts",
      format: "es",
    },
    plugins: [dts()],
  },
]);
