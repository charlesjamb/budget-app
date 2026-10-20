import { describe, it, expect } from "vite-plus/test";
import { decodeCsv } from "./csv-decode.js";

describe("decodeCsv", () => {
  it("decodes valid UTF-8 as is", () => {
    expect(decodeCsv(Buffer.from("CHEQUE N°123 – café", "utf-8"))).toBe("CHEQUE N°123 – café");
  });

  it("falls back to latin1 when the bytes are not valid UTF-8", () => {
    expect(decodeCsv(Buffer.from("CHEQUE N°123 Prélèvement", "latin1"))).toBe(
      "CHEQUE N°123 Prélèvement",
    );
  });

  it("decodes the euro sign in windows-1252 exports", () => {
    expect(decodeCsv(Buffer.from([0x35, 0x80]))).toBe("5€");
  });
});
