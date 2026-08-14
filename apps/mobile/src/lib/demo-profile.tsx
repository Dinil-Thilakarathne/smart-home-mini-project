import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const profileKey = "smart-home-profile-name";

type DemoProfileContextValue = {
  name: string | null;
  ready: boolean;
  saveName: (name: string) => Promise<void>;
};

const DemoProfileContext = createContext<DemoProfileContextValue | null>(null);

export function DemoProfileProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(profileKey).then((storedName) => setName(storedName?.trim() || null)).finally(() => setReady(true));
  }, []);

  const value = useMemo(() => ({ name, ready, saveName: async (nextName: string) => { const cleanName = nextName.trim(); await AsyncStorage.setItem(profileKey, cleanName); setName(cleanName); } }), [name, ready]);
  return <DemoProfileContext.Provider value={value}>{children}</DemoProfileContext.Provider>;
}

export function useDemoProfile() {
  const profile = useContext(DemoProfileContext);
  if (!profile) throw new Error("useDemoProfile must be used inside DemoProfileProvider.");
  return profile;
}
