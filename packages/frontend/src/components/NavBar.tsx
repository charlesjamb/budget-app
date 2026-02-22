import { Link, useRouterState } from "@tanstack/react-router";
import styled from "styled-components";
import { useLogout } from "../hooks/useAuth.js";

const Nav = styled.nav`
  background: #1a1a2e;
  padding: 0 24px;
  display: flex;
  align-items: center;
  height: 56px;
  gap: 8px;

  @media (max-width: 640px) {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    padding: 0;
    gap: 0;
    border-top: 1px solid #2d2d4e;
    z-index: 100;
  }
`;

const Brand = styled.span`
  color: #fff;
  font-weight: 700;
  font-size: 18px;
  margin-right: 24px;

  @media (max-width: 640px) {
    display: none;
  }
`;

const NavLink = styled(Link)<{ $active?: boolean }>`
  color: ${(p) => (p.$active ? "#fff" : "#8b8fa3")};
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  background: ${(p) => (p.$active ? "#16213e" : "transparent")};
  transition: all 0.15s;

  &:hover {
    color: #fff;
    background: #16213e;
  }

  @media (max-width: 640px) {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px 2px;
    border-radius: 0;
    font-size: 11px;
    font-weight: ${(p) => (p.$active ? "600" : "400")};
    height: 100%;
    background: transparent;
    border-top: 2px solid ${(p) => (p.$active ? "#fff" : "transparent")};

    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }
  }
`;

const Spacer = styled.div`
  flex: 1;

  @media (max-width: 640px) {
    display: none;
  }
`;

const LogoutButton = styled.button`
  background: none;
  border: 1px solid #8b8fa3;
  color: #8b8fa3;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    color: #fff;
    border-color: #fff;
  }

  @media (max-width: 640px) {
    display: none;
  }
`;

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/import", label: "Import" },
  { to: "/classify", label: "Classify" },
  { to: "/categories", label: "Categories" },
  { to: "/history", label: "History" },
  { to: "/settings", label: "Settings" },
] as const;

export function NavBar() {
  const logoutMutation = useLogout();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <Nav>
      <Brand>Budget</Brand>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          $active={
            item.to === "/"
              ? currentPath === "/"
              : currentPath.startsWith(item.to)
          }
        >
          {item.label}
        </NavLink>
      ))}
      <Spacer />
      <LogoutButton onClick={() => logoutMutation.mutate()}>
        Logout
      </LogoutButton>
    </Nav>
  );
}
