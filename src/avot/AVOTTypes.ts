import { SIOSOperation } from '../kodex/KodexTypes';

export interface AVOTRegistryEntry extends SIOSOperation {
  handler: string;
  category?: string;
}

export type AVOTInvocation = {
  command: string;
  intentOperationId: string;
  args?: Record<string, unknown>;
};
