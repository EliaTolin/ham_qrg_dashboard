import { describe, expect, it } from "vitest";
import { parseFrequencyQuery } from "./parse-frequency-query";

describe("parseFrequencyQuery", () => {
  describe("MHz input (decimal or small integer)", () => {
    it("parses '430.975' as 430.975 MHz with ±1 kHz tolerance", () => {
      expect(parseFrequencyQuery("430.975")).toEqual({
        minHz: 430_974_000,
        maxHz: 430_976_000,
      });
    });

    it("parses '145.500' as 145.5 MHz", () => {
      expect(parseFrequencyQuery("145.500")).toEqual({
        minHz: 145_499_000,
        maxHz: 145_501_000,
      });
    });

    it("parses integer MHz like '145'", () => {
      expect(parseFrequencyQuery("145")).toEqual({
        minHz: 144_999_000,
        maxHz: 145_001_000,
      });
    });

    it("accepts comma as decimal separator", () => {
      expect(parseFrequencyQuery("430,975")).toEqual({
        minHz: 430_974_000,
        maxHz: 430_976_000,
      });
    });

    it("trims whitespace", () => {
      expect(parseFrequencyQuery("  430.975  ")).toEqual({
        minHz: 430_974_000,
        maxHz: 430_976_000,
      });
    });
  });

  describe("raw Hz input (large integer)", () => {
    it("parses '430975000' as raw Hz", () => {
      expect(parseFrequencyQuery("430975000")).toEqual({
        minHz: 430_974_000,
        maxHz: 430_976_000,
      });
    });

    it("parses '145500000' as raw Hz", () => {
      expect(parseFrequencyQuery("145500000")).toEqual({
        minHz: 145_499_000,
        maxHz: 145_501_000,
      });
    });

    it("treats exactly the threshold boundary as Hz", () => {
      // 10000 is the threshold; values >= 10000 are Hz
      expect(parseFrequencyQuery("10000")).toEqual({
        minHz: 9_000,
        maxHz: 11_000,
      });
    });

    it("treats just below threshold as MHz", () => {
      expect(parseFrequencyQuery("9999")).toEqual({
        minHz: 9_999_000_000 - 1000,
        maxHz: 9_999_000_000 + 1000,
      });
    });
  });

  describe("non-frequency input", () => {
    it("returns null for a callsign", () => {
      expect(parseFrequencyQuery("IZ8WNH")).toBeNull();
    });

    it("returns null for a locality", () => {
      expect(parseFrequencyQuery("Marsala")).toBeNull();
    });

    it("returns null for a locator", () => {
      expect(parseFrequencyQuery("JM67FS")).toBeNull();
    });

    it("returns null for an empty string", () => {
      expect(parseFrequencyQuery("")).toBeNull();
    });

    it("returns null for whitespace only", () => {
      expect(parseFrequencyQuery("   ")).toBeNull();
    });

    it("returns null for a mixed alphanumeric string", () => {
      expect(parseFrequencyQuery("430.975 MHz")).toBeNull();
    });

    it("returns null for multiple dots", () => {
      expect(parseFrequencyQuery("430.9.75")).toBeNull();
    });

    it("returns null for negative numbers", () => {
      expect(parseFrequencyQuery("-430")).toBeNull();
    });
  });
});
