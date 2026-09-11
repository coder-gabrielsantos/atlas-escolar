'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ACCESS_PROFILES,
  AccessProfile,
  buildSchoolContext,
  SCHOOLS,
} from '@/lib/atlas-data';

type AtlasState = {
  state: string;
  municipality: string;
  schoolName: string;
  profile: AccessProfile;
  compareMunicipal: boolean;
};

type AtlasContextValue = AtlasState & {
  states: string[];
  municipalities: string[];
  schools: typeof SCHOOLS;
  schoolContext: ReturnType<typeof buildSchoolContext>;
  setStateValue: (value: string) => void;
  setMunicipality: (value: string) => void;
  setSchoolName: (value: string) => void;
  setProfile: (value: AccessProfile) => void;
  setCompareMunicipal: (value: boolean) => void;
  selectSchoolContext: (schoolName: string, profile?: AccessProfile) => void;
};

const DEFAULT_STATE: AtlasState = {
  state: 'MA',
  municipality: 'Coelho Neto',
  schoolName: 'IEMA PLENO COELHO NETO',
  profile: 'Gestor(a) Escolar',
  compareMunicipal: true,
};

const AtlasContext = createContext<AtlasContextValue | null>(null);

export function AtlasProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AtlasState>(DEFAULT_STATE);

  useEffect(() => {
    const stored = window.localStorage.getItem('atlas-settings');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as Partial<AtlasState>;
      const schoolExists = SCHOOLS.some((school) => school.name === parsed.schoolName);
      const profileExists = ACCESS_PROFILES.includes(parsed.profile as AccessProfile);
      const timer = window.setTimeout(() => {
        setSettings({
          ...DEFAULT_STATE,
          ...parsed,
          schoolName: schoolExists ? parsed.schoolName! : DEFAULT_STATE.schoolName,
          profile: profileExists ? parsed.profile! : DEFAULT_STATE.profile,
        });
      }, 0);
      return () => window.clearTimeout(timer);
    } catch {
      window.localStorage.removeItem('atlas-settings');
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('atlas-settings', JSON.stringify(settings));
  }, [settings]);

  const states = useMemo(() => [...new Set(SCHOOLS.map((school) => school.state))].sort(), []);
  const municipalities = useMemo(
    () => [...new Set(SCHOOLS.filter((school) => school.state === settings.state).map((school) => school.municipality))].sort(),
    [settings.state],
  );
  const schools = useMemo(
    () => SCHOOLS.filter(
      (school) => school.state === settings.state && school.municipality === settings.municipality,
    ),
    [settings.state, settings.municipality],
  );
  const schoolContext = useMemo(
    () => buildSchoolContext(settings.schoolName, settings.compareMunicipal),
    [settings.schoolName, settings.compareMunicipal],
  );

  const setStateValue = useCallback((state: string) => {
    const municipality = SCHOOLS.find((school) => school.state === state)?.municipality ?? '';
    const schoolName = SCHOOLS.find(
      (school) => school.state === state && school.municipality === municipality,
    )?.name ?? '';
    setSettings((current) => ({ ...current, state, municipality, schoolName }));
  }, []);

  const setMunicipality = useCallback((municipality: string) => {
    setSettings((current) => {
      const schoolName = SCHOOLS.find(
        (school) => school.state === current.state && school.municipality === municipality,
      )?.name ?? '';
      return { ...current, municipality, schoolName };
    });
  }, []);

  const setSchoolName = useCallback((schoolName: string) => setSettings((current) => ({ ...current, schoolName })), []);
  const setProfile = useCallback((profile: AccessProfile) => setSettings((current) => ({ ...current, profile })), []);
  const setCompareMunicipal = useCallback((compareMunicipal: boolean) => setSettings((current) => ({ ...current, compareMunicipal })), []);
  const selectSchoolContext = useCallback((schoolName: string, profile?: AccessProfile) => {
    const school = SCHOOLS.find((item) => item.name === schoolName);
    if (!school) return;
    setSettings((current) => ({
      ...current,
      state: school.state,
      municipality: school.municipality,
      schoolName: school.name,
      profile: profile ?? current.profile,
    }));
  }, []);

  const value: AtlasContextValue = {
    ...settings,
    states,
    municipalities,
    schools,
    schoolContext,
    setStateValue,
    setMunicipality,
    setSchoolName,
    setProfile,
    setCompareMunicipal,
    selectSchoolContext,
  };

  return <AtlasContext.Provider value={value}>{children}</AtlasContext.Provider>;
}

export function useAtlas() {
  const context = useContext(AtlasContext);
  if (!context) throw new Error('useAtlas must be used inside AtlasProvider');
  return context;
}
