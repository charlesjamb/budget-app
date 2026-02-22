import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { createGlobalStyle } from "styled-components";
import type { QueryClient } from "@tanstack/react-query";

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #f5f5f5;
    color: #111827;
    line-height: 1.5;
  }
`;

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <GlobalStyle />
      <Outlet />
    </>
  );
}
