export class CommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommandError";
  }
}

export class CommandArgumentError extends CommandError {
  constructor(message: string) {
    super(message);
    this.name = "CommandArgumentError";
  }
}
