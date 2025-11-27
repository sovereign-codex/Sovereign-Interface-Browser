import type { CommandDefinition } from '../CommandParser';
import { CommandIntent, SIOSOperation } from '../KodexTypes';

const normalize = (value: string): string => value.trim().toLowerCase();

const matchManifest = (manifestOps: SIOSOperation[], query: string): SIOSOperation | undefined => {
  const normalizedQuery = normalize(query);
  return manifestOps.find(
    (op) => normalize(op.id) === normalizedQuery || normalize(op.name).includes(normalizedQuery)
  );
};

const siosCommand: CommandDefinition = {
  id: 'sios',
  matcher: (input: string) => input.toLowerCase().startsWith('sios:'),
  parse: (input: string, context) => {
    const query = input.slice('sios:'.length).trim();
    const manifestOp = context.manifest ? matchManifest(context.manifest.operations, query) : undefined;

    if (manifestOp) {
      return {
        operationId: manifestOp.id,
        summary: manifestOp.description,
        confidence: 0.88,
        source: 'rule'
      };
    }

    return {
      operationId: 'manifest.search',
      summary: 'Search manifest for matching operation.',
      confidence: 0.6,
      source: 'rule',
      arguments: { query }
    } satisfies CommandIntent;
  }
};

const cmsCommand: CommandDefinition = {
  id: 'cms',
  matcher: (input: string) => input.toLowerCase().startsWith('cms:'),
  parse: (input: string) => ({
    operationId: 'cms.command',
    summary: 'Execute repository-scope CMS directive.',
    confidence: 0.72,
    source: 'rule',
    arguments: { directive: input.slice('cms:'.length).trim() }
  })
};

export const systemCommands: CommandDefinition[] = [siosCommand, cmsCommand];
