import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import styled from "styled-components";
import { useAuth } from "../hooks/useAuth.js";
import { NavBar } from "../components/NavBar.js";

const Layout = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Main = styled.main`
  flex: 1;
  max-width: 960px;
  width: 100%;
  margin: 0 auto;
  padding: 24px;

  @media (max-width: 640px) {
    padding: 16px 16px 80px;
  }
`;

const LoadingScreen = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  font-size: 18px;
  color: #6b7280;
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
    <Layout>
      <NavBar />
      <Main>
        <Outlet />
      </Main>
    </Layout>
  );
}
