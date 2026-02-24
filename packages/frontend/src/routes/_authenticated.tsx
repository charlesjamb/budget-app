import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import styled from "styled-components";
import { useAuth } from "../hooks/useAuth.js";
import { NavBar } from "../components/NavBar.js";
import { SidebarProvider, useSidebar } from "../contexts/SidebarContext.js";

const Layout = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: row;
`;

const Main = styled.main<{ $sidebarWidth: number }>`
  flex: 1;
  max-width: 1024px;
  width: 100%;
  margin: 0 auto;
  margin-left: ${(p) => p.$sidebarWidth}px;
  padding: 24px;
  min-height: 100vh;

  @media (max-width: 640px) {
    margin-left: 0;
    padding: 16px 16px 80px;
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
      <Outlet />
    </Main>
  );
}
