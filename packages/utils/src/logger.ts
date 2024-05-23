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

  log(message: string) {
    console.log(`${this.prefix} >> ${message}`);
  }

  debug(message: string) {
    console.debug(`${this.prefix} ${"[ DEBUG ]".blue} >> ${message}`);
  }

  error(message: string, error?: Error) {
    console.error(`${this.prefix} ${"[ ERROR ]".red} >> ${message}`, error);
  }
}
