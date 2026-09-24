import { describe, expect, it } from "vitest";

import {
  canonicalNameFor,
  datesForName,
  namesForDate,
  parseDate,
} from "../../src/engine.ts";

describe("parseDate", () => {
  describe("supported formats (AC4)", () => {
    it("parses D.M. (TC-NAMEDAY-001)", () => {
      expect(parseDate("7.3.")).toEqual({ day: 7, month: 3 });
    });

    it("parses D.M without a trailing dot (TC-NAMEDAY-002)", () => {
      expect(parseDate("7.3")).toEqual({ day: 7, month: 3 });
    });

    it("parses DD.MM. (TC-NAMEDAY-003)", () => {
      expect(parseDate("07.03.")).toEqual({ day: 7, month: 3 });
    });

    it("parses D.M.YYYY (TC-NAMEDAY-004)", () => {
      expect(parseDate("7.3.2024")).toEqual({ day: 7, month: 3 });
    });

    it("parses with an optional space after each dot (TC-NAMEDAY-005)", () => {
      expect(parseDate("7. 3. 2024")).toEqual({ day: 7, month: 3 });
    });

    it("parses ISO YYYY-MM-DD (TC-NAMEDAY-006)", () => {
      expect(parseDate("2024-03-07")).toEqual({ day: 7, month: 3 });
    });
  });

  describe("day boundaries (AC5.a/c, boundary value analysis)", () => {
    it("rejects a day past the month's max, e.g. 32.1. (TC-NAMEDAY-007)", () => {
      expect(parseDate("32.1.")).toBeNull();
    });

    it("accepts the month's max day, 31.1. (TC-NAMEDAY-008)", () => {
      expect(parseDate("31.1.")).toEqual({ day: 31, month: 1 });
    });

    it("rejects 31.4. — April has only 30 days (TC-NAMEDAY-009)", () => {
      expect(parseDate("31.4.")).toBeNull();
    });

    it("accepts 30.4. — April's max day (TC-NAMEDAY-010)", () => {
      expect(parseDate("30.4.")).toEqual({ day: 30, month: 4 });
    });

    it("rejects day 0 (TC-NAMEDAY-011)", () => {
      expect(parseDate("0.5.")).toBeNull();
    });

    it("accepts day 1, the minimum (TC-NAMEDAY-012)", () => {
      expect(parseDate("1.5.")).toEqual({ day: 1, month: 5 });
    });
  });

  describe("month boundaries (AC5.b/c, boundary value analysis)", () => {
    it("rejects month 13 (TC-NAMEDAY-013)", () => {
      expect(parseDate("7.13.")).toBeNull();
    });

    it("accepts month 12, the maximum (TC-NAMEDAY-014)", () => {
      expect(parseDate("7.12.")).toEqual({ day: 7, month: 12 });
    });

    it("rejects month 0 (TC-NAMEDAY-015)", () => {
      expect(parseDate("7.0.")).toBeNull();
    });
  });

  describe("sign (AC5.c)", () => {
    it("rejects a leading minus sign — never reaches the range check, fails the format regex first, same path as AC5.d (TC-NAMEDAY-057)", () => {
      expect(parseDate("-1.5.")).toBeNull();
    });
  });

  describe("unparsable input (AC5.d, negative equivalence partitioning)", () => {
    it("rejects a non-date string (TC-NAMEDAY-016)", () => {
      expect(parseDate("not-a-date")).toBeNull();
    });

    it("rejects an empty string (TC-NAMEDAY-017)", () => {
      expect(parseDate("")).toBeNull();
    });
  });

  describe("29.2. and leap years (AC6)", () => {
    it("accepts 29.2. in a leap year (TC-NAMEDAY-018)", () => {
      expect(parseDate("29.2.2024")).toEqual({ day: 29, month: 2 });
    });

    it("rejects 29.2. in a non-leap year (TC-NAMEDAY-019)", () => {
      expect(parseDate("29.2.2023")).toBeNull();
    });

    it("accepts 29.2. with no year given (TC-NAMEDAY-020)", () => {
      expect(parseDate("29.2.")).toEqual({ day: 29, month: 2 });
    });

    it("rejects 29.2.1900 — divisible by 100 but not by 400 (TC-NAMEDAY-021)", () => {
      expect(parseDate("29.2.1900")).toBeNull();
    });

    it("accepts 29.2.2000 — divisible by 400 (TC-NAMEDAY-022)", () => {
      expect(parseDate("29.2.2000")).toEqual({ day: 29, month: 2 });
    });

    it("accepts 29.2. in a leap year via the ISO branch — proves the leap check also fires on isoMatch's yearText, not only the Czech-format one (TC-NAMEDAY-055)", () => {
      expect(parseDate("2024-02-29")).toEqual({ day: 29, month: 2 });
    });

    it("rejects 29.2. in a non-leap year via the ISO branch (TC-NAMEDAY-056)", () => {
      expect(parseDate("2023-02-29")).toBeNull();
    });
  });
});

describe("namesForDate (AC1)", () => {
  it("returns the single name for a date with one entry (TC-NAMEDAY-023)", () => {
    expect(namesForDate(7, 3)).toEqual(["Tomáš"]);
  });

  it("returns an empty array for a date with no names (TC-NAMEDAY-024)", () => {
    expect(namesForDate(1, 1)).toEqual([]);
  });

  it("returns every name for a date with several entries (TC-NAMEDAY-025)", () => {
    expect(namesForDate(7, 4)).toEqual(["Heřman", "Hermína"]);
  });
});

describe("datesForName (AC2)", () => {
  it("returns the single date for a name with one entry (TC-NAMEDAY-026)", () => {
    expect(datesForName("Tomáš")).toEqual([{ day: 7, month: 3 }]);
  });

  it("returns every date for a name appearing more than once (TC-NAMEDAY-027)", () => {
    expect(datesForName("Petr")).toEqual([
      { day: 22, month: 2 },
      { day: 29, month: 6 },
    ]);
  });
});

describe("canonicalNameFor and name normalization (AC3)", () => {
  it("matches a name typed without diacritics and returns the canonical spelling (TC-NAMEDAY-028)", () => {
    expect(canonicalNameFor("tomas")).toBe("Tomáš");
  });

  it("matches a name with different casing and surrounding whitespace (TC-NAMEDAY-029)", () => {
    expect(canonicalNameFor("  TOMÁŠ  ")).toBe("Tomáš");
  });

  it("matches regardless of Unicode normalization form, NFC vs NFD (TC-NAMEDAY-030)", () => {
    const nfc = "Tomáš";
    const nfd = "Tomáš";

    expect(canonicalNameFor(nfc)).toBe("Tomáš");
    expect(canonicalNameFor(nfd)).toBe("Tomáš");
  });
});

describe("unknown and boundary-length names (AC7, AC15)", () => {
  it("returns null / an empty array for a name that is not in the calendar (TC-NAMEDAY-031)", () => {
    expect(canonicalNameFor("Xyzabc")).toBeNull();
    expect(datesForName("Xyzabc")).toEqual([]);
  });

  it("handles a name longer than any calendar entry without a crash or special handling (TC-NAMEDAY-032)", () => {
    expect(canonicalNameFor("Xyzabcdefgh")).toBeNull();
    expect(datesForName("Xyzabcdefgh")).toEqual([]);
  });
});
