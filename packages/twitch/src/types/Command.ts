import type { ApiClient } from "@twurple/api";
import type { BotCommandContext } from "@twurple/easy-bot";

/**
 * Represents a command that can be executed.
 */
export class CommandBuilder {
  private readonly _keyword: string;
  private _description: string | undefined;
  private readonly _arguments: ArgumentBuilder[];
  private _handler:
    | ((
        params: string[],
        context: BotCommandContext,
        apiClient: ApiClient
      ) => Promise<void>)
    | undefined;

  /**
   * Creates a new Command instance.
   * @param keyword The keyword associated with the command.
   */
  constructor(keyword: string) {
    this._keyword = keyword;
    this._arguments = [];
  }

  /**
   * Gets the keyword associated with the command.
   */
  get keyword(): string {
    return this._keyword;
  }

  /**
   * Gets the description of the command.
   */
  get description(): string {
    if (!this._description) {
      throw new Error("Command description is not set.");
    }
    return this._description;
  }

  /**
   * Sets the description of the command.
   * @param description The description of the command.
   * @returns The Command instance.
   */
  setDescription(description: string): this {
    this._description = description;
    return this;
  }

  private addArgument(type: ArgumentType, argument: ArgumentBuilder): this {
    if (type === ArgumentType.USER && this._arguments.length > 0) {
      throw new Error(
        "User arguments must be the first argument in the command."
      );
    }

    if (type === ArgumentType.STRING) {
      if (this._arguments.some((arg) => arg.type === ArgumentType.STRING)) {
        throw new Error("Only one string argument is allowed in a command.");
      }
    }

    // Ensure required arguments come before optional ones
    if (argument.required && this._arguments.some((arg) => !arg.required)) {
      throw new Error(
        "Required arguments must be defined before optional arguments."
      );
    }

    // Ensure only one optional argument and it's the last one
    if (!argument.required && this._arguments.some((arg) => !arg.required)) {
      throw new Error(
        "Only one optional argument is allowed in a command, and it must be the last argument."
      );
    }

    if (this._arguments.some((arg) => arg.name === argument.name)) {
      throw new Error("Argument names must be unique.");
    }

    this._arguments.push(argument.setType(type));
    return this;
  }

  /**
   * Adds a string argument to the command.
   * @param argument The string argument to add.
   * @returns The Command instance.
   */
  addStringArgument(argument: ArgumentBuilder): this {
    return this.addArgument(ArgumentType.STRING, argument);
  }

  /**
   * Adds a number argument to the command.
   * @param argument The number argument to add.
   * @returns The Command instance.
   */
  addNumberArgument(argument: ArgumentBuilder): this {
    return this.addArgument(ArgumentType.NUMBER, argument);
  }

  /**
   * Adds a user argument to the command.
   * @param argument The user argument to add.
   * @returns The Command instance.
   */
  addUserArgument(argument: ArgumentBuilder): this {
    return this.addArgument(ArgumentType.USER, argument);
  }

  /**
   * Gets the handler function for the command.
   */
  private get handler(): (
    params: string[],
    context: BotCommandContext,
    apiClient: ApiClient
  ) => Promise<void> {
    if (!this._handler) {
      throw new Error("Command handler is not set.");
    }
    return this._handler;
  }

  /**
   * Sets the handler function for the command.
   * @param handler The handler function that will be called when the command is executed.
   * @returns The Command instance.
   */
  setHandler(
    handler: (
      params: string[],
      context: BotCommandContext,
      apiClient: ApiClient
    ) => Promise<void>
  ): this {
    this._handler = handler;
    return this;
  }

  /**
   * Builds the command and checks for required properties.
   * @throws {Error} If a required property is missing.
   */
  build(): this {
    if (!this._description) {
      throw new Error("Command description is required.");
    }

    if (!this._handler) {
      throw new Error("Command handler is required.");
    }

    return this;
  }

  /**
   * Executes the command with the given arguments.
   * @param params The arguments to pass to the command.
   */
  async execute(
    params: string[],
    context: BotCommandContext,
    apiClient: ApiClient
  ): Promise<void> {
    if (params.length < this._arguments.filter((arg) => arg.required).length) {
      throw new CommandException(
        `Not enough arguments provided. Usage: ${this.getUsage()}`
      );
    }

    if (
      params.length > this._arguments.length &&
      this._arguments[this._arguments.length - 1].type !== ArgumentType.STRING
    ) {
      throw new CommandException(
        `Too many arguments provided. Usage: ${this.getUsage()}`
      );
    }

    if (
      params.length === this._arguments.length &&
      params.length > 0 &&
      !this._arguments[params.length - 1].validate(params[params.length - 1])
    ) {
      throw new CommandException("Invalid argument provided.");
    }

    await this.handler(params, context, apiClient);
  }

  /**
   * Returns the usage string for the command.
   */
  getUsage(): string {
    return `${this._keyword} ${this._arguments
      .map((arg) => (arg.required ? `<${arg.name}>` : `[${arg.name}]`))
      .join(" ")}`;
  }
}

/**
 * Represents an argument for a command.
 */
class ArgumentBuilder {
  private readonly _name: string;
  private _description: string | undefined;
  private _required: boolean = false;
  private _type: ArgumentType | undefined;

  constructor(name: string) {
    this._name = name;
  }

  /**
   * Gets the name of the argument.
   */
  get name(): string {
    return this._name;
  }

  /**
   * Gets the description of the argument.
   */
  get description(): string {
    if (!this._description) {
      throw new Error("Argument description is not set.");
    }
    return this._description;
  }

  /**
   * Gets whether the argument is required.
   */
  get required(): boolean {
    return this._required;
  }

  /**
   * Gets the type of the argument.
   */
  get type(): ArgumentType {
    if (!this._type) {
      throw new Error("Argument type is not set.");
    }
    return this._type;
  }

  /**
   * Sets the description of the argument.
   * @param description - The description of the argument.
   * @returns The argument instance.
   */
  setDescription(description: string): this {
    this._description = description;
    return this;
  }

  /**
   * Sets whether the argument is required.
   * @param required - Whether the argument is required.
   * @returns The argument instance.
   */
  setRequired(required: boolean): this {
    this._required = required;
    return this;
  }

  /**
   * Sets the type of the argument.
   * @param type - The type of the argument.
   * @returns The argument instance.
   */
  setType(type: ArgumentType): this {
    this._type = type;
    return this;
  }

  /**
   * Validates the value of the argument.
   * @param value - The value to validate.
   * @returns Whether the value is valid for the argument.
   */
  validate(value: string): boolean {
    switch (this.type) {
      case ArgumentType.STRING:
        return true;
      case ArgumentType.NUMBER:
        return Number.isInteger(Number(value));
      case ArgumentType.USER:
        return value.startsWith("@");
      default:
        return false;
    }
  }

  /**
   * Builds the argument and checks for required properties.
   * @throws {Error} If a required property is missing.
   */
  build(): this {
    if (!this._description) {
      throw new Error("Argument description is required.");
    }

    if (!this._type) {
      throw new Error("Argument type is required.");
    }

    return this;
  }
}

enum ArgumentType {
  STRING,
  NUMBER,
  USER,
}

class CommandException extends Error {
  constructor(message: string) {
    super(message);
  }
}
