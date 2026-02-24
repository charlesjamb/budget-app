import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { createGlobalStyle, ThemeProvider } from "styled-components";
import type { QueryClient } from "@tanstack/react-query";
import { theme } from "../theme.js";

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: ${(p) => p.theme.font.family};
    background: ${(p) => p.theme.colors.background};
    color: ${(p) => p.theme.colors.text};
    line-height: 1.5;
  }
`;

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Outlet />
    </ThemeProvider>
  );
}
