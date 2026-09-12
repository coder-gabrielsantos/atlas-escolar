'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  buildSchoolContext,
  DEFAULT_SCHOOL_CODE,
  SCHOOLS,
} from '@/lib/atlas-data';

type AtlasState = {
  state: string;
  municipality: string;
  schoolCode: string;
  compareMunicipal: boolean;
};

type AtlasContextValue = AtlasState & {
  states: string[];
  municipalities: string[];
  schools: typeof SCHOOLS;
  schoolContext: ReturnType<typeof buildSchoolContext>;
  setStateValue: (value: string) => void;
  setMunicipality: (value: string) => void;
  setSchoolCode: (value: string) => void;
  setCompareMunicipal: (value: boolean) => void;
  selectSchoolContext: (schoolCode: string) => void;
};

const DEFAULT_STATE: AtlasState = {
  state: 'MA',
  municipality: 'Coelho Neto',
  schoolCode: DEFAULT_SCHOOL_CODE,
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
      const storedSchool = SCHOOLS.find(
        (school) => school.code === parsed.schoolCode,
      );
      const timer = window.setTimeout(() => {
        setSettings({
          ...DEFAULT_STATE,
          ...parsed,
          state: storedSchool?.state ?? DEFAULT_STATE.state,
          municipality:
            storedSchool?.municipality ?? DEFAULT_STATE.municipality,
          schoolCode: storedSchool?.code ?? DEFAULT_STATE.schoolCode,
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

  const states = useMemo(
    () => [...new Set(SCHOOLS.map((school) => school.state))].sort(),
    [],
  );
  const municipalities = useMemo(
    () =>
      [
        ...new Set(
          SCHOOLS.filter((school) => school.state === settings.state).map(
            (school) => school.municipality,
          ),
        ),
      ].sort(),
    [settings.state],
  );
  const schools = useMemo(
    () =>
      SCHOOLS.filter(
        (school) =>
          school.state === settings.state &&
          school.municipality === settings.municipality,
      ),
    [settings.state, settings.municipality],
  );
  const schoolContext = useMemo(
    () => buildSchoolContext(settings.schoolCode, settings.compareMunicipal),
    [settings.schoolCode, settings.compareMunicipal],
  );

  const setStateValue = useCallback((state: string) => {
    const municipality =
      SCHOOLS.find((school) => school.state === state)?.municipality ?? '';
    const schoolCode =
      SCHOOLS.find(
        (school) =>
          school.state === state && school.municipality === municipality,
      )?.code ?? '';
    setSettings((current) => ({ ...current, state, municipality, schoolCode }));
  }, []);

  const setMunicipality = useCallback((municipality: string) => {
    setSettings((current) => {
      const schoolCode =
        SCHOOLS.find(
          (school) =>
            school.state === current.state &&
            school.municipality === municipality,
        )?.code ?? '';
      return { ...current, municipality, schoolCode };
    });
  }, []);

  const setSchoolCode = useCallback(
    (schoolCode: string) =>
      setSettings((current) => ({ ...current, schoolCode })),
    [],
  );
  const setCompareMunicipal = useCallback(
    (compareMunicipal: boolean) =>
      setSettings((current) => ({ ...current, compareMunicipal })),
    [],
  );
  const selectSchoolContext = useCallback((schoolCode: string) => {
    const school = SCHOOLS.find((item) => item.code === schoolCode);
    if (!school) return;
    setSettings((current) => ({
      ...current,
      state: school.state,
      municipality: school.municipality,
      schoolCode: school.code,
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
    setSchoolCode,
    setCompareMunicipal,
    selectSchoolContext,
  };

  return (
    <AtlasContext.Provider value={value}>{children}</AtlasContext.Provider>
  );
}

export function useAtlas() {
  const context = useContext(AtlasContext);
  if (!context) throw new Error('useAtlas must be used inside AtlasProvider');
  return context;
}
