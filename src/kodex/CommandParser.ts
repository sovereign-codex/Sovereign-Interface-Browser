import { CommandIntent, SIOSManifest } from './KodexTypes';
import { avotCommands } from './commands/avotCommands';
import { defaultCommands } from './commands/defaultCommands';
import { systemCommands } from './commands/systemCommands';

export interface CommandParseContext {
  manifest?: SIOSManifest | null;
}

export interface CommandDefinition {
  id: string;
  matcher: (input: string, context: CommandParseContext) => boolean;
  parse: (input: string, context: CommandParseContext) => CommandIntent | null;
}

export class CommandParser {
  private readonly definitions: CommandDefinition[];

  constructor(definitions: CommandDefinition[] = [...defaultCommands, ...avotCommands, ...systemCommands]) {
    this.definitions = definitions;
  }

  parse(command: string, context: CommandParseContext = {}): CommandIntent | null {
    const normalized = command.trim();
    if (!normalized) return null;

    for (const definition of this.definitions) {
      if (definition.matcher(normalized, context)) {
        const intent = definition.parse(normalized, context);
        if (intent) {
          return intent;
        }
      }
    }

    return null;
  }
}
