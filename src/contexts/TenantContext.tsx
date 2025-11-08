import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

type TenantCtx = {
  schoolId: string | null;
  setSchoolId: (id: string | null) => void;
  resolvedFrom: "subdomain" | "user" | "manual" | null;
};

const Ctx = createContext<TenantCtx>({
  schoolId: null,
  setSchoolId: () => {},
  resolvedFrom: null,
});

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [resolvedFrom, setResolvedFrom] = useState<TenantCtx["resolvedFrom"]>(null);

  useEffect(() => {
    // Resolve from subdomain: alpha.example.com -> "alpha"
    const parts = window.location.hostname.split(".");
    if (parts.length > 2 && parts[0] !== 'www') {
      setSchoolId(parts[0]);
      setResolvedFrom("subdomain");
    }
  }, []);

  const value = useMemo(() => ({ schoolId, setSchoolId, resolvedFrom }), [schoolId, resolvedFrom]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useTenant = () => useContext(Ctx);
