import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import styled from "styled-components";
import { useAuth } from "../hooks/useAuth.js";
import { NavBar } from "../components/NavBar.js";
import { SidebarProvider, useSidebar } from "../contexts/SidebarContext.js";
import { parseMonth } from "../lib/month.js";

const Layout = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: row;
`;

const Main = styled.main<{ $sidebarWidth: number }>`
  flex: 1;
  margin-left: ${(p) => p.$sidebarWidth}px;
  min-height: 100vh;

  @media (max-width: 640px) {
    margin-left: 0;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1024px;
  margin: 0 auto;
  padding: 24px;

  @media (max-width: 640px) {
    padding-block: 16px calc(80px + env(safe-area-inset-bottom, 0px));
    padding-inline: 16px;
  }
`;

const LoadingScreen = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  font-size: 18px;
  color: ${(p) => p.theme.colors.textMuted};
`;

export const Route = createFileRoute("/_authenticated")({
  validateSearch: (search: Record<string, unknown>): { month?: string } => ({
    month: parseMonth(search.month),
  }),
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingScreen>Loading...</LoadingScreen>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <SidebarProvider>
      <Layout>
        <NavBar />
        <MainContent />
      </Layout>
    </SidebarProvider>
  );
}

function MainContent() {
  const { collapsed } = useSidebar();
  const sidebarWidth = collapsed ? 72 : 240;
  return (
    <Main $sidebarWidth={sidebarWidth}>
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </Main>
  );
}
