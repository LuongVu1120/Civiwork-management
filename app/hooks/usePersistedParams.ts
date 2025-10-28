"use client";
import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ParamType = "string" | "number" | "boolean";

type Config<TKeys extends string> = Record<TKeys, { type: ParamType; default: any }>;

type Values<T extends Config<string>> = {
  [K in keyof T]: T[K]["type"] extends "number"
    ? number
    : T[K]["type"] extends "boolean"
    ? boolean
    : string;
};

export function usePersistedParams<TKeys extends string, TConfig extends Config<TKeys>>(config: TConfig) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const values = useMemo(() => {
    const result: Record<string, any> = {};
    const keys = Object.keys(config) as Array<keyof TConfig>;
    keys.forEach((key) => {
      const cfg = config[key];
      const raw = searchParams.get(String(key));
      if (raw == null) {
        result[String(key)] = cfg.default;
        return;
      }
      switch (cfg.type) {
        case "number": {
          const n = Number(raw);
          result[String(key)] = Number.isFinite(n) ? n : cfg.default;
          break;
        }
        case "boolean":
          result[String(key)] = raw === "true";
          break;
        default:
          result[String(key)] = raw;
      }
    });
    return result as Values<TConfig>;
  }, [searchParams, config]);

  const setParams = useCallback(
    (
      updates: Partial<Record<keyof TConfig, string | number | boolean | null | undefined>>,
      options?: { replace?: boolean }
    ) => {
      const sp = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          sp.delete(key);
          return;
        }
        sp.set(String(key), String(value));
      });
      const url = `${pathname}?${sp.toString()}`;
      if (options?.replace !== false) router.replace(url);
      else router.push(url);
    },
    [router, pathname, searchParams]
  );

  const setParam = useCallback(
    (key: keyof TConfig, value: string | number | boolean | null | undefined, options?: { replace?: boolean }) => {
      setParams({ [key]: value } as any, options);
    },
    [setParams]
  );

  return { values, setParams, setParam } as const;
}


