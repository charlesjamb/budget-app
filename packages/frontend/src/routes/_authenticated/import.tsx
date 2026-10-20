import { useMonth } from "../../hooks/useMonth.js";
import { FlowSteps } from "../../components/FlowSteps.js";
import { useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import styled from "styled-components";
import { Upload } from "lucide-react";
import { useImport } from "../../hooks/useImport.js";
import { Button, PageTitle, TitleRow } from "../../components/ui.js";

const UploadArea = styled.div`
  background: ${(p) => p.theme.colors.card};
  border: 2px dashed ${(p) => p.theme.colors.borderLight};
  border-radius: ${(p) => p.theme.radii.lg};
  padding: 48px;
  text-align: center;
  cursor: pointer;
  transition:
    border-color 0.15s,
    box-shadow 0.2s;
  box-shadow: ${(p) => p.theme.shadows.card};

  &:hover {
    border-color: ${(p) => p.theme.colors.primary};
    box-shadow: ${(p) => p.theme.shadows.cardHover};
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const UploadText = styled.p`
  color: ${(p) => p.theme.colors.textMuted};
  font-size: 16px;
  margin-bottom: 8px;
`;

const UploadHint = styled.p`
  color: ${(p) => p.theme.colors.textLight};
  font-size: 13px;
`;

const ResultCard = styled.div`
  background: ${(p) => p.theme.colors.card};
  border-radius: ${(p) => p.theme.radii.lg};
  box-shadow: ${(p) => p.theme.shadows.card};
  padding: 24px;
  margin-top: 24px;
`;

const ResultTitle = styled.h2`
  font-size: 18px;
  margin-bottom: 16px;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
  font-size: 15px;

  &:last-child {
    border-bottom: none;
  }
`;

const StatLabel = styled.span`
  color: ${(p) => p.theme.colors.textMuted};
`;

const StatValue = styled.span`
  font-weight: 600;
`;

const ClassifyLink = styled(Link)`
  display: inline-block;
  margin-top: 16px;
  color: ${(p) => p.theme.colors.primary};
  font-weight: 500;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export const Route = createFileRoute("/_authenticated/import")({
  component: ImportPage,
});

function ImportPage() {
  const [month] = useMonth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importMutation = useImport();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importMutation.mutate(file);
    }
  };

  return (
    <>
      <TitleRow>
        <Upload size={28} strokeWidth={2} />
        <PageTitle>Import CSV</PageTitle>
      </TitleRow>

      <FlowSteps flow="close" current="/import" month={month} />

      <UploadArea onClick={() => fileInputRef.current?.click()}>
        <UploadText>Click to upload your bank CSV file</UploadText>
        <UploadHint>Banque Populaire format (semicolon-separated)</UploadHint>
        <HiddenInput ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} />
        <Button type="button" disabled={importMutation.isPending} style={{ marginTop: 16 }}>
          {importMutation.isPending ? "Importing..." : "Select CSV File"}
        </Button>
      </UploadArea>

      {importMutation.isSuccess && importMutation.data && (
        <ResultCard>
          <ResultTitle>Import Complete</ResultTitle>
          <StatRow>
            <StatLabel>New transactions imported</StatLabel>
            <StatValue>{importMutation.data.imported}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Duplicates skipped</StatLabel>
            <StatValue>{importMutation.data.skipped}</StatValue>
          </StatRow>
          {importMutation.data.unmappedCount > 0 && (
            <>
              <StatRow>
                <StatLabel>Unmapped transactions</StatLabel>
                <StatValue>{importMutation.data.unmappedCount}</StatValue>
              </StatRow>
              <ClassifyLink to="/classify">Classify unmapped transactions &rarr;</ClassifyLink>
            </>
          )}
        </ResultCard>
      )}

      {importMutation.isError && (
        <ResultCard>
          <ResultTitle>Import Failed</ResultTitle>
          <p>An error occurred while importing the CSV file.</p>
        </ResultCard>
      )}
    </>
  );
}
