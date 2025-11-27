import { SovereignIdentity, SovereignKernel } from './kernel';

export function getIdentity(): SovereignIdentity {
  return SovereignKernel.instance.identity;
}

export function updateIdentity(label: string) {
  SovereignKernel.instance.updateIdentity({ label });
}
