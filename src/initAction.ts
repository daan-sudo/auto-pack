import { chooseMsxt } from "./interaction";
import { msxtDataList } from "./staticData";
import chalk from "chalk";
import fs from "fs-extra";
import shell from "shelljs";
import ora from "ora"; // 用于显示加载动画
let msxtType = ""; // 面试系统类型
let checkList = []; // 选择打包的端种类
let msxtTypeEn = ""; // 面试系统英文类型
let vuePath = ""; // vue项目路径
export default async function initAction() {
  const cacheJson = fs.readJSONSync(new URL("../cache.json", import.meta.url));
  console.log("cacheJson", cacheJson);
  msxtType = await chooseMsxt(
    "list",
    "请选择你想打包的面试系统",
    msxtDataList.map((item) => item.value)
  );
  msxtTypeEn = msxtDataList.find((item) => item.value === msxtType)?.type!;
  checkList = await chooseMsxt("checkbox", "请选择你要打包的端种类", [
    "所有的",
    "pc端",
    "h5端",
    "android端",
    "openHarmony端",
  ]);
  // 输入vue项目路径 如果缓存里面有,判断是否读取缓存
  if (!cacheJson[msxtTypeEn].vuePath) {
    vuePath = await chooseMsxt("input", `请输入${msxtType}的vue项目路径`);
    console.log("vuePath", vuePath);
  } else {
    const isUseCache = await chooseMsxt(
      "confirm",
      `是否使用缓存的vue项目路径: ${cacheJson[msxtTypeEn].vuePath}`
    );
    console.log("isUseCache", isUseCache);
    if (isUseCache) {
      vuePath = cacheJson[msxtTypeEn].vuePath;
    } else {
      vuePath = await chooseMsxt("input", `请输入${msxtType}的vue项目路径`);
    }
  }
  if (!fs.existsSync(vuePath)) {
    throw new Error(`${vuePath} 不存在`);
  }
  cacheJson[msxtTypeEn].vuePath = vuePath;
  fs.writeFileSync(
    new URL("../cache.json", import.meta.url),
    JSON.stringify(cacheJson)
  );
  // 判断是否重新打包vue工程
  const isRebuildVue = await chooseMsxt(
    "confirm",
    `是否重新打包${msxtType}的vue工程?`
  );
  if (isRebuildVue) {
    buildVue(vuePath);
  }
}
// 重新打包vue工程
function buildVue(vuePath: string) {
  console.log(vuePath, "vuePath");
  const spinner = ora("正在打包vue工程...").start();
  shell.cd(vuePath);
  const buildResult = shell.exec("npm run build");
  console.log(buildResult);
  if (buildResult.code !== 0) {
    spinner.fail(chalk.redBright("vue工程打包失败!"));
    throw new Error("vue工程打包失败，请检查错误信息");
  }
  spinner.succeed(chalk.greenBright("vue工程打包成功!"));
}
