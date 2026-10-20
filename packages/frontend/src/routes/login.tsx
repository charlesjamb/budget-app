import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import styled from "styled-components";
import { Wallet } from "lucide-react";
import { useAuth, useLogin } from "../hooks/useAuth.js";
import { Button, Input, Label, ErrorMessage } from "../components/ui.js";

const Page = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: ${(p) => p.theme.colors.background};
  padding: 24px;
`;

const Card = styled.div`
  background: ${(p) => p.theme.colors.card};
  padding: 40px;
  border-radius: ${(p) => p.theme.radii.lg};
  box-shadow: ${(p) => p.theme.shadows.cardHover};
  width: 100%;
  max-width: 400px;
`;

const IconWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
  color: ${(p) => p.theme.colors.primary};
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 24px;
  text-align: center;
  color: ${(p) => p.theme.colors.text};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const loginMutation = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <Page>
      <Card>
        <IconWrapper>
          <Wallet size={48} strokeWidth={1.5} />
        </IconWrapper>
        <Title>Budget Tracker</Title>
        <Form onSubmit={handleSubmit}>
          <Label>
            Email
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Label>
          <Label>
            Password
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Label>
          {loginMutation.isError && <ErrorMessage>Invalid email or password</ErrorMessage>}
          <Button type="submit" disabled={loginMutation.isPending} style={{ marginTop: 8 }}>
            {loginMutation.isPending ? "Logging in..." : "Log in"}
          </Button>
        </Form>
      </Card>
    </Page>
  );
}
