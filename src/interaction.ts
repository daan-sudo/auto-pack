// 做一些命令行交互
import inquirer from "inquirer";
// 单选框list
export const chooseMsxt = async (
  type: any,
  message: string,
  choices?: string[]
) => {
  const answer = await inquirer.prompt({
    type,
    name: "choose",
    message,
    choices,
    pageSize: 5,
  });
  return answer.choose;
};
