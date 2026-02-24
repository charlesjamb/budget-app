import { createContext, useContext, useState, useCallback } from "react";

const SIDEBAR_EXPANDED_KEY = "budget-sidebar-expanded";

function getStoredSidebarExpanded(): boolean {
  try {
    const stored = localStorage.getItem(SIDEBAR_EXPANDED_KEY);
    return stored !== "false";
  } catch {
    return true;
  }
}

type SidebarContextValue = {
  collapsed: boolean;
  toggleCollapse: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(!getStoredSidebarExpanded());

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_EXPANDED_KEY, String(!next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed, toggleCollapse }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    return { collapsed: false, toggleCollapse: () => {} };
  }
  return ctx;
}
