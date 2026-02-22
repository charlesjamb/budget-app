import { describe, it, expect } from "vitest";
import { parseCsv } from "./csv-parser.service.js";

const SAMPLE_CSV = `Date de comptabilisation;Libelle simplifie;Libelle operation;Reference;Informations complementaires;Type operation;Categorie;Sous categorie;Debit;Credit;Date operation;Date de valeur;Pointage operation
14/02/2026;dr HOARAU sc;CB dr HOARAU sc FACT 130226;;;Carte bancaire;Sante;Consultation medicale;-35,00;;13/02/2026;16/02/2026;0
12/02/2026;MME CONSTANCE SULOWSKI;VIR INST MME CONSTANCE SULOWSKI;2604385I40036790;Cadeau Maman-;Virement recu;Revenus et rentrees d'argent;Dons et cadeaux recus;;+43,00;12/02/2026;12/02/2026;0
10/02/2026;CARREFOUR MARKET;CB CARREFOUR MARKE FACT 070226;;;Carte bancaire;Alimentation;Hyper/supermarche;-12,77;;07/02/2026;10/02/2026;0
09/02/2026;REMBOURSEMENT AIRBNB MARIAGE CHLO;REMBOURSEMENT AIRBNB MARIAGE CHLO;2604085IN0069103;;Virement recu;Transaction exclue;Virement interne;;+100,00;09/02/2026;09/02/2026;0
09/02/2026;UBER EATS;CB UBER EATS FACT 060226;;;Carte bancaire;Alimentation;Restaurant;-28,20;;06/02/2026;09/02/2026;0`;

describe("CSV Parser", () => {
  it("should parse debit rows correctly", () => {
    const rows = parseCsv(SAMPLE_CSV);
    expect(rows).toHaveLength(3); // Only debits, no credits, no Transaction exclue
  });

  it("should convert French dates to YYYY-MM-DD", () => {
    const rows = parseCsv(SAMPLE_CSV);
    expect(rows[0].dateOperation).toBe("2026-02-13");
  });

  it("should convert French amounts to positive integer cents", () => {
    const rows = parseCsv(SAMPLE_CSV);
    expect(rows[0].amount).toBe(3500); // -35,00 → 3500
    expect(rows[1].amount).toBe(1277); // -12,77 → 1277
    expect(rows[2].amount).toBe(2820); // -28,20 → 2820
  });

  it("should extract bank category and sub-category", () => {
    const rows = parseCsv(SAMPLE_CSV);
    expect(rows[0].bankCategory).toBe("Sante");
    expect(rows[0].bankSubCategory).toBe("Consultation medicale");
  });

  it("should extract labels", () => {
    const rows = parseCsv(SAMPLE_CSV);
    expect(rows[0].labelSimplified).toBe("dr HOARAU sc");
    expect(rows[0].labelOperation).toBe("CB dr HOARAU sc FACT 130226");
  });

  it("should skip credit-only rows", () => {
    const rows = parseCsv(SAMPLE_CSV);
    const creditRow = rows.find((r) => r.labelSimplified.includes("CONSTANCE"));
    expect(creditRow).toBeUndefined();
  });

  it("should skip Transaction exclue rows", () => {
    const rows = parseCsv(SAMPLE_CSV);
    const excludedRow = rows.find((r) =>
      r.labelSimplified.includes("REMBOURSEMENT"),
    );
    expect(excludedRow).toBeUndefined();
  });

  it("should handle empty CSV", () => {
    const rows = parseCsv("");
    expect(rows).toEqual([]);
  });

  it("should handle header-only CSV", () => {
    const rows = parseCsv(
      "Date de comptabilisation;Libelle simplifie;Libelle operation;Reference;Informations complementaires;Type operation;Categorie;Sous categorie;Debit;Credit;Date operation;Date de valeur;Pointage operation",
    );
    expect(rows).toEqual([]);
  });
});
