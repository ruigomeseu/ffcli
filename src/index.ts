import { Command } from "commander";
import { registerAuthCommand } from "./commands/auth.ts";
import { registerMeCommand } from "./commands/me.ts";
import { registerListCommand } from "./commands/list.ts";
import { registerShowCommand } from "./commands/show.ts";

const program = new Command();

program
  .name("ffcli")
  .description("Fireflies.ai CLI — query meeting data from the command line")
  .version("0.1.1");

registerAuthCommand(program);
registerMeCommand(program);
registerListCommand(program);
registerShowCommand(program);

program.parse();
