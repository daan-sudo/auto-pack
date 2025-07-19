import { chooseMsxt } from "./interaction";
import { msxtDataList, packNameStart } from "./staticData";
import chalk from "chalk";
import fs from "fs-extra";
import dayjs from "dayjs";
import path from "path";
import shell from "shelljs";
import JSON5 from "json5"; // 用于解析json5文件
import ora from "ora"; // 用于显示加载动画
let msxtType = ""; // 面试系统类型
let checkList: string[] = []; // 选择打包的端种类
let msxtTypeEn = ""; // 面试系统英文类型
let vuePath = ""; // vue项目路径
let version = ""; // 版本号
let cacheJson: Record<string, any> = {}; // 读取缓存数据
const buildNumber = `${dayjs().format("YYMMDD")}01`; // 打包时间戳
let devecSdkHome = ""; // devec-sdk.js的路径
let hvigorwHome = ""; // hvigorw.js的路径
export default async function initAction() {
  try {
    cacheJson = fs.readJSONSync(new URL("../cache.json", import.meta.url));
    devecSdkHome = cacheJson.devecSdkHome || ""; // devec-sdk.js的路径
    hvigorwHome = cacheJson.hvigorwHome || ""; // hvigorw.js的路径
    console.log("cacheJson", cacheJson);
    msxtType = await chooseMsxt(
      "list",
      "请选择你想打包的面试系统",
      msxtDataList.map((item) => item.value)
    );
    msxtTypeEn = msxtDataList.find((item) => item.value === msxtType)?.type!;
    const checkType = await chooseMsxt("checkbox", "请选择你要打包的端种类", [
      "all",
      "pc端",
      "h5端",
      "android端",
      "openHarmony端",
    ]);
    console.log("checkType", checkType);
    for (const type of checkType) {
      if (type === "all") {
        checkList = ["h5", "android", "openHarmony", "pc"];
        break; // 如果选择了all,则直接跳出循环
      } else if (type === "pc端") {
        checkList.push("pc");
      } else if (type === "h5端") {
        checkList.push("h5");
      } else if (type === "android端") {
        checkList.push("android");
      } else if (type === "openHarmony端") {
        checkList.push("openHarmony");
      }
    }
    // 确定版本号
    if (!cacheJson[msxtTypeEn].version) {
      version = await chooseMsxt("input", `请输入${msxtType}的版本号`);
    } else {
      const cacheVeison = cacheJson[msxtTypeEn].version;
      const isUseCacheVersion = await chooseMsxt(
        "confirm",
        `当前${msxtType}版本号是: ${cacheVeison}，是否使用缓存版本号?`
      );
      if (isUseCacheVersion) {
        version = cacheVeison;
      } else {
        version = await chooseMsxt("input", `请输入${msxtType}的版本号`);
      }
    }
    cacheJson[msxtTypeEn].version = version; //缓存版本号
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

    // 判断是否重新打包vue工程
    const isRebuildVue = await chooseMsxt(
      "confirm",
      `是否重新打包${msxtType}的vue工程?`
    );
    if (isRebuildVue) {
      await buildVue(vuePath);
    } else {
      const isExistHarmony = checkList.includes("openHarmony"); //判断是否需要打鸿蒙端
      if (isExistHarmony) {
        packHarmony();
      } else {
        // todo...
      }
    }
    fs.writeFileSync(
      new URL("../cache.json", import.meta.url),
      JSON.stringify(cacheJson)
    );
  } catch (error) {
    console.log(error);
    console.log(chalk.yellow("打包失败，请检查错误信息"));
  }
}
// 重新打包vue工程
async function buildVue(vuePath: string) {
  const isExistHarmony = checkList.includes("openHarmony"); //判断是否需要打鸿蒙端
  console.log("isExistHarmony", isExistHarmony, "checkList", checkList);
  shell.cd(vuePath);
  if (isExistHarmony) {
    const spinner = ora("正在打包鸿蒙版本的vue工程...").start();
    const buildResult = shell.exec("npm run build:harmony");
    console.log(buildResult);
    if (buildResult.code !== 0) {
      spinner.fail(chalk.redBright("vue工程打包失败!"));
      throw new Error("vue工程打包失败，请检查错误信息");
    }
    spinner.succeed(chalk.greenBright("鸿蒙版本vue工程打包成功!"));
    await packHarmony();
  } else {
    const spinner = ora("正在打包vue工程...").start();
    const buildResult = shell.exec("npm run build");
    console.log(buildResult);
    if (buildResult.code !== 0) {
      spinner.fail(chalk.redBright("vue工程打包失败!"));
      throw new Error("vue工程打包失败，请检查错误信息");
    }
    spinner.succeed(chalk.greenBright("vue工程打包成功!"));
    // 准备打包electron或者其他端
  }
}
//
// 打包鸿蒙
async function packHarmony() {
  const cacheHomonyPath = cacheJson[msxtTypeEn].openHarmonyPath; // 缓存的鸿蒙目录
  let openHarmonyPath = "";
  // 鸿蒙目录
  if (!cacheHomonyPath) {
    openHarmonyPath = await chooseMsxt("input", `请输入${msxtType}的鸿蒙目录`);
  } else {
    const isUseCache = await chooseMsxt(
      "confirm",
      `是否使用缓存的鸿蒙目录: ${cacheHomonyPath}`
    );
    if (isUseCache) {
      openHarmonyPath = cacheHomonyPath;
    } else {
      openHarmonyPath = await chooseMsxt(
        "input",
        `请输入${msxtType}的鸿蒙目录`
      );
    }
  }
  if (!fs.existsSync(openHarmonyPath)) {
    throw new Error(`${openHarmonyPath} 不存在`);
  }
  cacheJson[msxtTypeEn].openHarmonyPath = openHarmonyPath; // 缓存鸿蒙目录
  // 把vue打包的dist目录拷贝到鸿蒙目录
  const vueDistPath = `${vuePath}/pack`;
  const outPutPath = path.join(
    openHarmonyPath,
    "entry",
    "build",
    "default",
    "outputs",
    "default"
  );
  const rawFile = path.join(
    openHarmonyPath,
    "entry",
    "src",
    "main",
    "resources",
    "rawfile"
  );
  fs.copySync(vueDistPath, rawFile); // 拷贝vue打包的dist目录到鸿蒙目录的rawfile
  console.log(
    chalk.greenBright(`已将vue打包的pack目录拷贝到鸿蒙目录的rawfile`)
  );
  const appJson5Path = path.join(openHarmonyPath, "AppScope", "app.json5");
  const buildProfileJson5path = path.join(
    openHarmonyPath,
    "build-profile.json5"
  );
  const appJson5Txt = JSON5.parse(fs.readFileSync(appJson5Path, "utf-8"));
  const buildProfileJson5Txt = JSON5.parse(
    fs.readFileSync(buildProfileJson5path, "utf-8")
  );
  console.log("appJson5Txt", appJson5Txt);
  console.log("buildProfileJson5Txt", buildProfileJson5Txt);
  shell.cd(openHarmonyPath);
  // 检查devecSdkHome是否存在
  if (devecSdkHome) {
    const isUseCacheSdkHome = await chooseMsxt(
      "confirm",
      `是否使用缓存的devecSdkHome: ${devecSdkHome}`
    );
    if (!isUseCacheSdkHome) {
      devecSdkHome = await chooseMsxt("input", "请输入devecSdkHome");
    }
  } else {
    devecSdkHome = await chooseMsxt("input", "请输入devecSdkHome");
  }
  if (!fs.existsSync(devecSdkHome)) {
    throw new Error(`${devecSdkHome} 不存在`);
  }
  // 检查hvigorwHome是否存在
  if (hvigorwHome) {
    const isUseCacheHvigorwHome = await chooseMsxt(
      "confirm",
      "是否使用缓存的hvigorwHome"
    );
    if (!isUseCacheHvigorwHome) {
      hvigorwHome = await chooseMsxt("input", "请输入hvigorw.js的路径");
    }
  } else {
    hvigorwHome = await chooseMsxt("input", "请输入hvigorw.js的路径");
  }
  if (!fs.existsSync(hvigorwHome)) {
    throw new Error(`${hvigorwHome} 不存在`);
  }
  const spinner = ora("正在打包鸿蒙版本的vue工程...").start();
  for (let i = 1; i <= 10; i++) {
    appJson5Txt.app.bundleName = `keyee.ms${i}.examiner`;
    if (i === 1) {
      // 修复赋值错误为比较操作
      buildProfileJson5Txt.app.products[0].signingConfig = "default";
    } else {
      buildProfileJson5Txt.app.products[0].signingConfig = `default${i}`;
    }
    fs.writeFileSync(appJson5Path, JSON5.stringify(appJson5Txt));
    fs.writeFileSync(
      buildProfileJson5path,
      JSON5.stringify(buildProfileJson5Txt)
    );
    console.log(`第${i}个包文件修改完成, 准备打包!`);
    const buildResult = shell.exec(
      `node ${hvigorwHome} --mode module -p product=default assembleHap --analyze=normal --parallel --incremental --daemon`,
      {
        env: {
          ...process.env, // 继承当前 shell 的环境变量
          DEVECO_SDK_HOME: devecSdkHome, // 手动注入 SDK 路径
        },
      }
    );
    if (buildResult.code !== 0) {
      spinner.fail(chalk.redBright(`第${i}个包打包失败!`));
      throw new Error("鸿蒙打包失败，请检查错误信息");
    }
    spinner.succeed(chalk.greenBright(`第${i}个包打包成功!`));
    const oldFileName = path.join(outPutPath, `entry-default-signed.hap`);
    const newFileName = path.join(
      outPutPath,
      `${packNameStart[i - 1]}-面试系统-评分器-v${version}-${buildNumber}.hap`
    );
    if (fs.existsSync(oldFileName)) {
      fs.renameSync(oldFileName, newFileName);
      console.log(`已将打包的文件重命名为: ${newFileName}`);
    }
  }
  spinner.succeed(`鸿蒙版本${msxtType}打包完成!`);
}
