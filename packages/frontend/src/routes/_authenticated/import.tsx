import { useMonth } from "../../hooks/useMonth.js";
import { FlowSteps } from "../../components/FlowSteps.js";
import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import styled from "styled-components";
import { Upload } from "lucide-react";
import { useImport } from "../../hooks/useImport.js";
import { Button, PageTitle, TitleRow } from "../../components/ui.js";

const DropZone = styled.div<{ $active: boolean }>`
  background: ${(p) => (p.$active ? p.theme.colors.accentSoft : p.theme.colors.card)};
  border: 2px dashed ${(p) => (p.$active ? p.theme.colors.primary : p.theme.colors.borderLight)};
  border-radius: ${(p) => p.theme.radii.lg};
  padding: ${(p) => p.theme.space.xxl};
  text-align: center;
  box-shadow: ${(p) => p.theme.shadows.card};
  transition:
    border-color 0.15s,
    background 0.15s;
`;

const HiddenInput = styled.input`
  display: none;
`;

const DropIcon = styled.div`
  color: ${(p) => p.theme.colors.primary};
  margin-bottom: ${(p) => p.theme.space.sm};
`;

const DropText = styled.p`
  font-size: ${(p) => p.theme.fontSize.lg};
  margin-bottom: ${(p) => p.theme.space.xs};
`;

const DropHint = styled.p`
  color: ${(p) => p.theme.colors.textLight};
  font-size: ${(p) => p.theme.fontSize.sm};
  margin-bottom: ${(p) => p.theme.space.lg};
`;

const ResultCard = styled.div`
  background: ${(p) => p.theme.colors.card};
  border-radius: ${(p) => p.theme.radii.lg};
  box-shadow: ${(p) => p.theme.shadows.card};
  padding: ${(p) => p.theme.space.xl};
  margin-top: ${(p) => p.theme.space.xl};
`;

const ResultTitle = styled.h2`
  font-size: ${(p) => p.theme.fontSize.xl};
  margin-bottom: ${(p) => p.theme.space.md};
`;

const Stats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${(p) => p.theme.space.md} ${(p) => p.theme.space.xl};
`;

const Stat = styled.div`
  display: flex;
  flex-direction: column;
`;

const StatValue = styled.span`
  font-size: ${(p) => p.theme.fontSize.xxl};
  font-weight: 700;
  font-variant-numeric: tabular-nums;
`;

const StatLabel = styled.span`
  color: ${(p) => p.theme.colors.textMuted};
  font-size: ${(p) => p.theme.fontSize.sm};
`;

const ClassifyLink = styled.div`
  margin-top: ${(p) => p.theme.space.lg};

  a {
    color: ${(p) => p.theme.colors.primary};
    font-weight: 600;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
`;

export const Route = createFileRoute("/_authenticated/import")({
  component: ImportPage,
});

function ImportPage() {
  const [month] = useMonth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const importMutation = useImport();

  const handleFile = (file: File | undefined) => {
    if (file) importMutation.mutate(file);
  };

  return (
    <>
      <TitleRow>
        <Upload size={28} strokeWidth={2} />
        <PageTitle>Import CSV</PageTitle>
      </TitleRow>

      <FlowSteps flow="close" current="/import" month={month} />

      <DropZone
        $active={dragging}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
      >
        <DropIcon>
          <Upload size={32} strokeWidth={1.5} />
        </DropIcon>
        <DropText>Drop your bank CSV here</DropText>
        <DropHint>Banque Populaire format (semicolon-separated)</DropHint>
        <HiddenInput
          ref={fileInputRef}
          type="file"
          accept=".csv"
          aria-label="Bank CSV file"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Button
          type="button"
          disabled={importMutation.isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          {importMutation.isPending ? "Importing..." : "Select CSV file"}
        </Button>
      </DropZone>

      {importMutation.isSuccess && importMutation.data && (
        <ResultCard>
          <ResultTitle>Import complete</ResultTitle>
          <Stats>
            <Stat>
              <StatValue>{importMutation.data.imported}</StatValue>
              <StatLabel>imported</StatLabel>
            </Stat>
            <Stat>
              <StatValue>{importMutation.data.skipped}</StatValue>
              <StatLabel>duplicates skipped</StatLabel>
            </Stat>
            <Stat>
              <StatValue>{importMutation.data.unmappedCount}</StatValue>
              <StatLabel>to classify</StatLabel>
            </Stat>
          </Stats>
          {importMutation.data.unmappedCount > 0 && (
            <ClassifyLink>
              <Link to="/classify" search={{ month }}>
                Classify {importMutation.data.unmappedCount} transactions &rarr;
              </Link>
            </ClassifyLink>
          )}
        </ResultCard>
      )}

      {importMutation.isError && (
        <ResultCard>
          <ResultTitle>Import failed</ResultTitle>
          <p>An error occurred while importing the CSV file.</p>
        </ResultCard>
      )}
    </>
  );
}
