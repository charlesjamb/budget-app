import { useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import styled from "styled-components";
import { useImport } from "../../hooks/useImport.js";

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 24px;
`;

const UploadArea = styled.div`
  background: #fff;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 48px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s;

  &:hover {
    border-color: #3b82f6;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const UploadText = styled.p`
  color: #6b7280;
  font-size: 16px;
  margin-bottom: 8px;
`;

const UploadHint = styled.p`
  color: #9ca3af;
  font-size: 13px;
`;

const Button = styled.button`
  background: #1a1a2e;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 16px;

  &:hover {
    background: #16213e;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ResultCard = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
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
  border-bottom: 1px solid #f3f4f6;
  font-size: 15px;

  &:last-child {
    border-bottom: none;
  }
`;

const StatLabel = styled.span`
  color: #6b7280;
`;

const StatValue = styled.span`
  font-weight: 600;
`;

const ClassifyLink = styled(Link)`
  display: inline-block;
  margin-top: 16px;
  color: #3b82f6;
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
      <Title>📥 Import CSV</Title>

      <UploadArea onClick={() => fileInputRef.current?.click()}>
        <UploadText>Click to upload your bank CSV file</UploadText>
        <UploadHint>Banque Populaire format (semicolon-separated)</UploadHint>
        <HiddenInput
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
        />
        <Button type="button" disabled={importMutation.isPending}>
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
              <ClassifyLink to="/classify">
                Classify unmapped transactions &rarr;
              </ClassifyLink>
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
