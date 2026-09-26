import { createRouter } from "@tanstack/react-router";

import { NotFound } from "./components/not-found";
import { RouteError } from "./components/route-error";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: RouteError,
    defaultNotFoundComponent: NotFound,
  });

  return router;
};
