#! /usr/bin/env node
import chalk from "chalk";

import { program } from "commander";
import initAction from "./initAction";
import fs from "fs-extra";
const pkg = fs.readJSONSync(new URL("../package.json", import.meta.url));
program
  .version(pkg.version, "-v", "--version") // 设置版本号
  .description("快速打包全流程工具");
program
  .name("auto-pack") // 设置命令名称
  .description("面试系统全流程自动打包脚本")
  .on("--help", () => {
    console.log(
      `\r\nRun ${chalk.cyan(
        `auto-pack <command> --help`
      )} for detailed usage of given command\r\n`
    );
  });
program
  .command("start") // 定义命令
  .description("打包开始")
  .action(initAction);
program.parse(process.argv); // 解析命令行参数
