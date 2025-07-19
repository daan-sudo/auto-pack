import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
// import dts from "rollup-plugin-dts";
import json from "@rollup/plugin-json";
import { defineConfig } from "rollup";

const input = "src/index.ts";

export default defineConfig(
  {
    input,
    output: [
      { file: "dist/index.esm.js", format: "esm" },
      { file: "dist/index.cjs", format: "cjs" },
    ],
    plugins: [
      resolve(),
      commonjs(),
      json(),
      typescript({ tsconfig: "./tsconfig.json", declaration: true }),
    ],
    external: ["shelljs"],
    // treeshake: {
    //   // 对所有模块禁用 Tree-shaking（或仅针对 chalk）
    //   moduleSideEffects: true,
    //   // 保留未被显式引用的代码
    //   propertyReadSideEffects: true,
    // },
  }
  // {
  //   input,
  //   output: {
  //     file: "dist/index.d.ts",
  //     format: "es",
  //   },
  //   plugins: [dts()],
  // },
);
