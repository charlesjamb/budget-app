import { useState } from "react";
import { Link, useRouterState, useSearch } from "@tanstack/react-router";
import styled from "styled-components";
import { useSidebar } from "../contexts/SidebarContext.js";
import {
  LayoutDashboard,
  FolderOpen,
  BarChart3,
  Receipt,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Menu,
} from "lucide-react";
import { useLogout } from "../hooks/useAuth.js";
import { useMonthRhythm } from "../hooks/useMonthRhythm.js";
import { useUncategorizedSubcategories } from "../hooks/useTransactions.js";
import { PiggyBankIcon } from "./PiggyBankIcon.js";

const overviewItems = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", icon: Receipt },
  { to: "/history", label: "History", icon: BarChart3 },
] as const;

const planItems = [
  { to: "/budget", label: "Budget" },
  { to: "/plan/wires", label: "Wires" },
] as const;

const closeItems = [
  { to: "/import", label: "Import" },
  { to: "/classify", label: "Classify" },
  { to: "/close/settle", label: "Settle up" },
] as const;

const setupItems = [
  { to: "/categories", label: "Categories", icon: FolderOpen },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const sheetItems = [
  { to: "/history", label: "History", icon: BarChart3 },
  { to: "/categories", label: "Categories", icon: FolderOpen },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const FLOW_PATHS = ["/budget", "/plan", "/import", "/classify", "/close"];

function shortMonthName(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1).toLocaleDateString("en-US", { month: "short" });
}

const SidebarWrapper = styled.aside<{ $collapsed: boolean }>`
  width: ${(p) => (p.$collapsed ? 72 : 240)}px;
  min-width: ${(p) => (p.$collapsed ? 72 : 240)}px;
  background: ${(p) => p.theme.colors.sidebar};
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  border-right: 1px solid ${(p) => p.theme.colors.border};

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
  color: ${(p) => p.theme.colors.text};
  flex-shrink: 0;
`;

const BrandText = styled.span<{ $visible: boolean }>`
  color: ${(p) => p.theme.colors.text};
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
  padding: 8px 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
`;

const NavGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const GroupLabel = styled.div<{ $collapsed: boolean; $emphasised?: boolean }>`
  margin-top: ${(p) => p.theme.space.lg};
  padding: ${(p) => (p.$collapsed ? "0" : `4px ${p.theme.space.lg}`)};
  font-size: ${(p) => p.theme.fontSize.xs};
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  color: ${(p) => (p.$emphasised ? p.theme.colors.primary : p.theme.colors.textLight)};
  border-top: ${(p) => (p.$collapsed ? `1px solid ${p.theme.colors.border}` : "none")};
  height: ${(p) => (p.$collapsed ? "1px" : "auto")};
  overflow: hidden;
`;

const NavLink = styled(Link)<{ $active?: boolean; $collapsed?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: ${(p) => (p.$collapsed ? "center" : "flex-start")};
  gap: ${(p) => (p.$collapsed ? 0 : 12)}px;
  padding: 10px ${(p) => (p.$collapsed ? 10 : 16)}px;
  border-radius: ${(p) => p.theme.radii.md};
  color: ${(p) => (p.$active ? p.theme.colors.primary : p.theme.colors.textMuted)};
  text-decoration: none;
  font-size: 14px;
  font-weight: ${(p) => (p.$active ? 600 : 500)};
  background: ${(p) => (p.$active ? p.theme.colors.accentSoft : "transparent")};
  transition: all 0.15s;

  &:hover {
    background: ${(p) => p.theme.colors.accentSoft};
    color: ${(p) => p.theme.colors.primary};
  }
`;

const NavLabel = styled.span<{ $visible: boolean }>`
  white-space: nowrap;
  overflow: hidden;
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  width: ${(p) => (p.$visible ? "auto" : 0)};
  flex: ${(p) => (p.$visible ? 1 : "none")};
  transition:
    opacity 0.15s,
    width 0.15s;
`;

const StepDot = styled.span<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: ${(p) => p.theme.radii.pill};
  font-size: ${(p) => p.theme.fontSize.xs};
  font-weight: 600;
  background: ${(p) => (p.$active ? p.theme.colors.primary : p.theme.colors.border)};
  color: ${(p) => (p.$active ? p.theme.colors.onPrimary : p.theme.colors.textMuted)};
`;

const Badge = styled.span<{ $collapsed?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: ${(p) => (p.$collapsed ? "0" : "0 6px")};
  border-radius: ${(p) => p.theme.radii.pill};
  background: ${(p) => p.theme.colors.primary};
  color: ${(p) => p.theme.colors.onPrimary};
  font-size: ${(p) => p.theme.fontSize.xs};
  font-weight: 600;
  line-height: 1;

  ${(p) =>
    p.$collapsed &&
    `
    position: absolute;
    top: 4px;
    right: 8px;
    min-width: 8px;
    width: 8px;
    height: 8px;
    font-size: 0;
  `}
`;

const SidebarFooter = styled.div<{ $collapsed?: boolean }>`
  padding: ${(p) => (p.$collapsed ? "12px 8px" : "16px 12px")};
  border-top: 1px solid ${(p) => p.theme.colors.border};
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
  color: ${(p) => p.theme.colors.textMuted};
  cursor: pointer;
  font-size: 14px;
  border-radius: ${(p) => p.theme.radii.md};
  transition: background 0.15s;

  &:hover {
    background: ${(p) => p.theme.colors.accentSoft};
  }
`;

const LogoutButton = styled.button<{ $collapsed?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${(p) => (p.$collapsed ? "center" : "flex-start")};
  gap: 12px;
  padding: 10px ${(p) => (p.$collapsed ? 10 : 16)}px;
  width: 100%;
  background: ${(p) => p.theme.colors.card};
  border: 1px solid ${(p) => p.theme.colors.border};
  color: ${(p) => p.theme.colors.textMuted};
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  border-radius: ${(p) => p.theme.radii.md};
  transition: all 0.15s;

  &:hover {
    background: ${(p) => p.theme.colors.accentSoft};
  }
`;

const BottomNav = styled.nav`
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(60px + env(safe-area-inset-bottom, 0px));
  padding: 0 8px env(safe-area-inset-bottom, 0px);
  background: ${(p) => p.theme.colors.card};
  border-top: 1px solid ${(p) => p.theme.colors.border};
  z-index: 100;

  @media (max-width: 640px) {
    display: flex;
    align-items: center;
    justify-content: space-around;
  }
`;

const tabStyles = `
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px 4px;
  font-size: 11px;
  text-decoration: none;
  cursor: pointer;
`;

const BottomNavLink = styled(Link)<{ $active?: boolean }>`
  ${tabStyles}
  color: ${(p) => (p.$active ? p.theme.colors.primary : p.theme.colors.textMuted)};
  font-weight: ${(p) => (p.$active ? 600 : 500)};
  border-radius: ${(p) => p.theme.radii.sm};
  transition: all 0.15s;

  &:hover {
    color: ${(p) => p.theme.colors.primary};
    background: ${(p) => p.theme.colors.background};
  }
`;

const MenuButton = styled.button<{ $active?: boolean }>`
  ${tabStyles}
  background: none;
  border: none;
  color: ${(p) => (p.$active ? p.theme.colors.primary : p.theme.colors.textMuted)};
  font-weight: ${(p) => (p.$active ? 600 : 500)};
  border-radius: ${(p) => p.theme.radii.sm};
  transition: all 0.15s;

  &:hover {
    color: ${(p) => p.theme.colors.primary};
    background: ${(p) => p.theme.colors.background};
  }
`;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  background: ${(p) => p.theme.colors.overlay};
`;

const Sheet = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 101;
  background: ${(p) => p.theme.colors.card};
  border-radius: ${(p) => p.theme.radii.lg} ${(p) => p.theme.radii.lg} 0 0;
  padding: ${(p) => p.theme.space.sm} ${(p) => p.theme.space.lg}
    calc(${(p) => p.theme.space.lg} + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const SheetItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 12px;
  color: ${(p) => p.theme.colors.text};
  text-decoration: none;
  font-size: ${(p) => p.theme.fontSize.lg};
  border-radius: ${(p) => p.theme.radii.md};

  &:hover {
    background: ${(p) => p.theme.colors.background};
  }
`;

const SheetButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 12px;
  background: none;
  border: none;
  border-top: 1px solid ${(p) => p.theme.colors.border};
  color: ${(p) => p.theme.colors.textMuted};
  font-size: ${(p) => p.theme.fontSize.lg};
  cursor: pointer;
  text-align: left;
`;

export function NavBar() {
  const logoutMutation = useLogout();
  const routerState = useRouterState();
  const { month } = useSearch({ from: "/_authenticated" });
  const { planMonth, closeMonth, planEmphasised } = useMonthRhythm();
  const { data: uncategorized } = useUncategorizedSubcategories();
  const { collapsed, toggleCollapse } = useSidebar();
  const [sheetOpen, setSheetOpen] = useState(false);

  const currentPath = routerState.location.pathname;
  const isActive = (to: string) => (to === "/" ? currentPath === "/" : currentPath.startsWith(to));
  const inFlow = FLOW_PATHS.some((path) => currentPath.startsWith(path));
  const inSheet = sheetItems.some((item) => isActive(item.to));

  const unclassifiedCount = (uncategorized?.subcategories ?? []).reduce(
    (sum, group) => sum + group.count,
    0,
  );

  // styled(Link) erases the router's route typing, so search objects are cast here once.
  const searchFor = (value: string | undefined) => ({ month: value }) as never;
  const keepMonth = searchFor(month);

  const monthTab = planEmphasised
    ? { to: "/budget", search: searchFor(planMonth) }
    : { to: "/import", search: searchFor(closeMonth) };

  return (
    <>
      <SidebarWrapper $collapsed={collapsed}>
        <SidebarBrand $collapsed={collapsed}>
          <BrandIcon size={28} />
          <BrandText $visible={!collapsed}>Budget</BrandText>
        </SidebarBrand>
        <NavList>
          <NavGroup>
            {overviewItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  search={keepMonth}
                  $active={isActive(item.to)}
                  $collapsed={collapsed}
                >
                  <Icon size={20} strokeWidth={2} />
                  <NavLabel $visible={!collapsed}>{item.label}</NavLabel>
                </NavLink>
              );
            })}
          </NavGroup>

          <NavGroup>
            <GroupLabel $collapsed={collapsed} $emphasised={planEmphasised}>
              {!collapsed && `Plan · ${shortMonthName(planMonth)}`}
            </GroupLabel>
            {planItems.map((item, i) => (
              <NavLink
                key={item.to}
                to={item.to}
                search={searchFor(planMonth)}
                $active={isActive(item.to)}
                $collapsed={collapsed}
              >
                <StepDot $active={isActive(item.to)}>{i + 1}</StepDot>
                <NavLabel $visible={!collapsed}>{item.label}</NavLabel>
              </NavLink>
            ))}
          </NavGroup>

          <NavGroup>
            <GroupLabel $collapsed={collapsed}>
              {!collapsed && `Close · ${shortMonthName(closeMonth)}`}
            </GroupLabel>
            {closeItems.map((item, i) => (
              <NavLink
                key={item.to}
                to={item.to}
                search={searchFor(closeMonth)}
                $active={isActive(item.to)}
                $collapsed={collapsed}
              >
                <StepDot $active={isActive(item.to)}>{i + 1}</StepDot>
                <NavLabel $visible={!collapsed}>{item.label}</NavLabel>
                {item.to === "/classify" && unclassifiedCount > 0 && (
                  <Badge $collapsed={collapsed}>{unclassifiedCount}</Badge>
                )}
              </NavLink>
            ))}
          </NavGroup>

          <NavGroup>
            <GroupLabel $collapsed={collapsed} />
            {setupItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  search={keepMonth}
                  $active={isActive(item.to)}
                  $collapsed={collapsed}
                >
                  <Icon size={20} strokeWidth={2} />
                  <NavLabel $visible={!collapsed}>{item.label}</NavLabel>
                </NavLink>
              );
            })}
          </NavGroup>
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
          <LogoutButton $collapsed={collapsed} onClick={() => logoutMutation.mutate()}>
            <LogOut size={20} strokeWidth={2} />
            {!collapsed && <NavLabel $visible>Logout</NavLabel>}
          </LogoutButton>
        </SidebarFooter>
      </SidebarWrapper>

      <BottomNav aria-label="Main">
        <BottomNavLink to="/" search={keepMonth} $active={isActive("/")}>
          <LayoutDashboard size={22} strokeWidth={2} />
          Overview
        </BottomNavLink>
        <BottomNavLink to="/transactions" search={keepMonth} $active={isActive("/transactions")}>
          <Receipt size={22} strokeWidth={2} />
          Transactions
        </BottomNavLink>
        <BottomNavLink to={monthTab.to} search={monthTab.search} $active={inFlow}>
          <CalendarDays size={22} strokeWidth={2} />
          Month
        </BottomNavLink>
        <MenuButton
          $active={inSheet}
          onClick={() => setSheetOpen((open) => !open)}
          aria-expanded={sheetOpen}
          aria-label="Menu"
        >
          <Menu size={22} strokeWidth={2} />
          Menu
        </MenuButton>
      </BottomNav>

      {sheetOpen && (
        <>
          <Backdrop onClick={() => setSheetOpen(false)} aria-hidden />
          <Sheet role="dialog" aria-label="Menu">
            {sheetItems.map((item) => {
              const Icon = item.icon;
              return (
                <SheetItem
                  key={item.to}
                  to={item.to}
                  search={keepMonth}
                  onClick={() => setSheetOpen(false)}
                >
                  <Icon size={20} strokeWidth={2} />
                  {item.label}
                </SheetItem>
              );
            })}
            <SheetButton onClick={() => logoutMutation.mutate()}>
              <LogOut size={20} strokeWidth={2} />
              Logout
            </SheetButton>
          </Sheet>
        </>
      )}
    </>
  );
}
