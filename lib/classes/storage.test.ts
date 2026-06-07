import { beforeEach, describe, expect, it, vi } from "vitest";

import { CLASSES_STORAGE_KEY } from "@/lib/classes/constants";
import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
import {
  loadInstitutionClasses,
  persistInstitutionClasses,
  upsertInstitutionClass,
} from "@/lib/classes/storage";

describe("institution classes storage", () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    const ls = {
      getItem(k: string) {
        return store[k] ?? null;
      },
      setItem(k: string, v: string) {
        store[k] = v;
      },
    };
    vi.stubGlobal("localStorage", ls);
    vi.stubGlobal("window", {
      localStorage: ls,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    persistInstitutionClasses([], { silent: true });
  });

  it("creates class and enforces single-class assignment", () => {
    const a = upsertInstitutionClass({
      id: null,
      name: "12-A",
      field: "sayisal",
      studentIds: ["s1", "s2"],
    });
    upsertInstitutionClass({
      id: null,
      name: "12-B",
      field: "esit",
      studentIds: ["s2", "s3"],
    });
    const list = loadInstitutionClasses();
    const classA = list.find((c) => c.id === a.id)!;
    const classB = list.find((c) => c.name === "12-B")!;
    expect(classA.studentIds).toEqual(["s1"]);
    expect(classB.studentIds).toEqual(["s2", "s3"]);
    expect(panelGetItem(CLASSES_STORAGE_KEY)).toBeTruthy();
  });
});
