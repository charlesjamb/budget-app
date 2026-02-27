import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
} from "@tanstack/react-router";
import { ThemeModeProvider } from "../contexts/ThemeModeContext.js";
import { routeTree } from "../routeTree.gen.js";

interface TestWrapperProps {
  initialPath?: string;
}

export function TestWrapper({ initialPath = "/" }: TestWrapperProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const history = createMemoryHistory({ initialEntries: [initialPath] });
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history,
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeModeProvider>
        <RouterProvider router={router as never} />
      </ThemeModeProvider>
    </QueryClientProvider>
  );
}
