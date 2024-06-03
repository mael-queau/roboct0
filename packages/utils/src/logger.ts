import "colors";

type Colour =
  | "bgBlack"
  | "bgRed"
  | "bgGreen"
  | "bgYellow"
  | "bgBlue"
  | "bgMagenta"
  | "bgCyan"
  | "bgWhite";

export class Logger {
  private prefix: string;

  constructor(prefix: string, colour?: Colour) {
    this.prefix = `[ ${prefix} ]`;
    if (colour) {
      this.prefix = this.prefix[colour];
    }
  }

  log(...args: any[]) {
    console.log(this.prefix, ">>", ...args);
  }

  info(...args: any[]) {
    console.info(this.prefix, "[ INFO ]".cyan, ">>", ...args);
  }

  debug(...args: any[]) {
    console.debug(this.prefix, "[ DEBUG ]".blue, ">>", ...args);
  }

  error(...args: any[]) {
    console.error(this.prefix, "[ ERROR ]".red, ">>", ...args);
  }
}
