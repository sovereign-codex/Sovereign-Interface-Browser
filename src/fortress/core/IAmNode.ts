import { SIBStorage } from '../../storage/SIBStorage';

const STORAGE_KEY = 'fortress.iam.profile';

export interface IAmProfile {
  id: string;
  title: string;
  essenceSignature: string;
  talents: string[];
  missionTrajectory: string;
  coherenceIndex: number;
  sovereignFlags: Record<string, boolean>;
  traits: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

const storage = new SIBStorage('fortress_v1');

const defaultProfile: IAmProfile = {
  id: 'iam-town-hall',
  title: 'I-AM Town Hall',
  essenceSignature: 'unbound',
  talents: [],
  missionTrajectory: 'Awaiting definition',
  coherenceIndex: 0,
  sovereignFlags: {
    initialized: true,
    authenticated: false,
  },
  traits: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

let profile: IAmProfile = { ...defaultProfile };

const cloneProfile = (state: IAmProfile): IAmProfile => ({
  ...state,
  talents: [...state.talents],
  sovereignFlags: { ...state.sovereignFlags },
  traits: { ...state.traits },
});

export const getIAmProfile = (): IAmProfile => cloneProfile(profile);

export const saveIAmProfile = (): void => {
  storage.setItem(STORAGE_KEY, profile);
};

export const loadIAmProfile = (): IAmProfile => {
  const stored = storage.getItem<IAmProfile>(STORAGE_KEY);
  if (stored) {
    profile = cloneProfile({ ...defaultProfile, ...stored, traits: stored.traits ?? {} });
    return getIAmProfile();
  }

  profile = { ...defaultProfile, createdAt: defaultProfile.createdAt, updatedAt: defaultProfile.updatedAt };
  saveIAmProfile();
  return getIAmProfile();
};

export const updateIAmProfile = (updates: Partial<IAmProfile>): IAmProfile => {
  profile = {
    ...profile,
    ...updates,
    talents: updates.talents ? [...updates.talents] : profile.talents,
    sovereignFlags: updates.sovereignFlags
      ? { ...profile.sovereignFlags, ...updates.sovereignFlags }
      : profile.sovereignFlags,
    traits: updates.traits ? { ...profile.traits, ...updates.traits } : profile.traits,
    updatedAt: new Date().toISOString(),
  };
  saveIAmProfile();
  return getIAmProfile();
};
