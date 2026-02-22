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
`;

const Brand = styled.span`
  color: #fff;
  font-weight: 700;
  font-size: 18px;
  margin-right: 24px;
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
`;

const Spacer = styled.div`
  flex: 1;
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
