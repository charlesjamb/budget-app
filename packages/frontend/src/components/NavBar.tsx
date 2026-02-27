import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import styled from "styled-components";
import { useSidebar } from "../contexts/SidebarContext.js";
import {
  LayoutDashboard,
  Wallet,
  Upload,
  Tags,
  FolderOpen,
  BarChart3,
  Receipt,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { useLogout } from "../hooks/useAuth.js";
import { PiggyBankIcon } from "./PiggyBankIcon.js";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/budget", label: "Budget", icon: Wallet },
  { to: "/import", label: "Import", icon: Upload },
  { to: "/classify", label: "Classify", icon: Tags },
  { to: "/transactions", label: "Transactions", icon: Receipt },
  { to: "/categories", label: "Categories", icon: FolderOpen },
  { to: "/history", label: "History", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const primaryNavItems = navItems.filter((item) =>
  [
    "/",
    "/budget",
    "/import",
    "/classify",
    "/transactions",
    "/settings",
  ].includes(item.to),
);
const moreNavItems = navItems.filter((item) =>
  ["/categories", "/history"].includes(item.to),
);

const SidebarWrapper = styled.aside<{ $collapsed: boolean }>`
  width: ${(p) => (p.$collapsed ? 72 : 240)}px;
  min-width: ${(p) => (p.$collapsed ? 72 : 240)}px;
  background: ${(p) => p.theme.gradients.sidebar};
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.08);

  @media (max-width: 640px) {
    display: none;
  }
`;

const SidebarBrand = styled.div<{ $collapsed: boolean }>`
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: ${(p) => (p.$collapsed ? "center" : "flex-start")};
  padding: 0 ${(p) => (p.$collapsed ? 0 : 20)}px;
  gap: ${(p) => (p.$collapsed ? 0 : 12)}px;
  flex-shrink: 0;
`;

const BrandIcon = styled(PiggyBankIcon)`
  color: #fff;
  flex-shrink: 0;
`;

const BrandText = styled.span<{ $visible: boolean }>`
  color: #fff;
  font-weight: 700;
  font-size: 18px;
  white-space: nowrap;
  overflow: hidden;
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  width: ${(p) => (p.$visible ? "auto" : 0)};
  transition:
    opacity 0.15s,
    width 0.15s;
`;

const NavList = styled.nav`
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
`;

const NavLink = styled(Link)<{ $active?: boolean; $collapsed?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${(p) => (p.$collapsed ? "center" : "flex-start")};
  gap: ${(p) => (p.$collapsed ? 0 : 12)}px;
  padding: 10px ${(p) => (p.$collapsed ? 10 : 16)}px;
  border-radius: ${(p) => p.theme.radii.md};
  color: ${(p) => (p.$active ? "#fff" : "rgba(255, 255, 255, 0.85)")};
  text-decoration: none;
  font-size: 14px;
  font-weight: ${(p) => (p.$active ? 600 : 500)};
  background: ${(p) =>
    p.$active ? "rgba(255, 255, 255, 0.2)" : "transparent"};
  transition: all 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
  }
`;

const NavLabel = styled.span<{ $visible: boolean }>`
  white-space: nowrap;
  overflow: hidden;
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  width: ${(p) => (p.$visible ? "auto" : 0)};
  transition:
    opacity 0.15s,
    width 0.15s;
`;

const SidebarFooter = styled.div<{ $collapsed?: boolean }>`
  padding: ${(p) => (p.$collapsed ? "12px 8px" : "16px 12px")};
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const CollapseButton = styled.button<{ $collapsed?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${(p) => (p.$collapsed ? "center" : "flex-start")};
  gap: 12px;
  padding: 10px ${(p) => (p.$collapsed ? 10 : 16)}px;
  width: 100%;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  font-size: 14px;
  border-radius: ${(p) => p.theme.radii.md};
  transition: background 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const LogoutButton = styled.button<{ $collapsed?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${(p) => (p.$collapsed ? "center" : "flex-start")};
  gap: 12px;
  padding: 10px ${(p) => (p.$collapsed ? 10 : 16)}px;
  width: 100%;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  border-radius: ${(p) => p.theme.radii.md};
  transition: all 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }
`;

const BottomNav = styled.nav`
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: ${(p) => p.theme.colors.card};
  border-top: 1px solid ${(p) => p.theme.colors.border};
  z-index: 100;
  padding: 0 8px;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);

  @media (max-width: 640px) {
    display: flex;
    align-items: center;
    justify-content: space-around;
  }
`;

const BottomNavLink = styled(Link)<{ $active?: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px 4px;
  color: ${(p) =>
    p.$active ? p.theme.colors.primary : p.theme.colors.textMuted};
  text-decoration: none;
  font-size: 10px;
  font-weight: ${(p) => (p.$active ? 600 : 500)};
  border-radius: ${(p) => p.theme.radii.sm};
  transition: all 0.15s;

  &:hover {
    color: ${(p) => p.theme.colors.primary};
    background: ${(p) => p.theme.colors.background};
  }
`;

const MoreButton = styled.button<{ $active?: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px 4px;
  background: none;
  border: none;
  color: ${(p) =>
    p.$active ? p.theme.colors.primary : p.theme.colors.textMuted};
  font-size: 10px;
  font-weight: ${(p) => (p.$active ? 600 : 500)};
  cursor: pointer;
  border-radius: ${(p) => p.theme.radii.sm};
  transition: all 0.15s;

  &:hover {
    color: ${(p) => p.theme.colors.primary};
    background: ${(p) => p.theme.colors.background};
  }
`;

const MoreMenu = styled.div<{ $open: boolean }>`
  position: fixed;
  bottom: 70px;
  right: 16px;
  background: ${(p) => p.theme.colors.card};
  border-radius: ${(p) => p.theme.radii.md};
  box-shadow: ${(p) => p.theme.shadows.cardHover};
  padding: 8px;
  display: ${(p) => (p.$open ? "flex" : "none")};
  flex-direction: column;
  gap: 2px;
  z-index: 101;
  min-width: 140px;
`;

const MoreMenuItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  color: ${(p) => p.theme.colors.text};
  text-decoration: none;
  font-size: 14px;
  border-radius: ${(p) => p.theme.radii.sm};
  transition: background 0.15s;

  &:hover {
    background: ${(p) => p.theme.colors.background};
  }
`;

export function NavBar() {
  const logoutMutation = useLogout();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { collapsed, toggleCollapse } = useSidebar();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (to: string) =>
    to === "/" ? currentPath === "/" : currentPath.startsWith(to);
  const isMoreActive = moreNavItems.some((item) => isActive(item.to));

  return (
    <>
      <SidebarWrapper $collapsed={collapsed}>
        <SidebarBrand $collapsed={collapsed}>
          <BrandIcon size={28} />
          <BrandText $visible={!collapsed}>Budget</BrandText>
        </SidebarBrand>
        <NavList>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                $active={isActive(item.to)}
                $collapsed={collapsed}
              >
                <Icon size={20} strokeWidth={2} />
                <NavLabel $visible={!collapsed}>{item.label}</NavLabel>
              </NavLink>
            );
          })}
        </NavList>
        <SidebarFooter $collapsed={collapsed}>
          <CollapseButton $collapsed={collapsed} onClick={toggleCollapse}>
            {collapsed ? (
              <ChevronRight size={20} strokeWidth={2} />
            ) : (
              <>
                <ChevronLeft size={20} strokeWidth={2} />
                <NavLabel $visible={!collapsed}>Collapse</NavLabel>
              </>
            )}
          </CollapseButton>
          <LogoutButton
            $collapsed={collapsed}
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut size={20} strokeWidth={2} />
            {!collapsed && <NavLabel $visible>Logout</NavLabel>}
          </LogoutButton>
        </SidebarFooter>
      </SidebarWrapper>

      <BottomNav>
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <BottomNavLink
              key={item.to}
              to={item.to}
              $active={isActive(item.to)}
            >
              <Icon size={22} strokeWidth={2} />
              {item.label}
            </BottomNavLink>
          );
        })}
        <div style={{ position: "relative" }}>
          <MoreButton
            $active={isMoreActive}
            onClick={() => setMoreOpen((o) => !o)}
            aria-expanded={moreOpen}
          >
            <MoreHorizontal size={22} strokeWidth={2} />
            More
          </MoreButton>
          <MoreMenu $open={moreOpen}>
            {moreNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <MoreMenuItem
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                >
                  <Icon size={18} strokeWidth={2} />
                  {item.label}
                </MoreMenuItem>
              );
            })}
          </MoreMenu>
        </div>
      </BottomNav>
      {moreOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
          }}
          onClick={() => setMoreOpen(false)}
          aria-hidden
        />
      )}
    </>
  );
}
