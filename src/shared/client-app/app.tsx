import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// deno-lint-ignore no-unused-vars
import { createBrowserRouter, Outlet, RouteObject, RouterProvider } from 'react-router-dom';

// IMPORTS

// deno-lint-ignore prefer-const
let routes: RouteObject[] = [];
// ROUTES

const router = createBrowserRouter(routes);

addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app')!;
  createRoot(app).render(
    (
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>
    ),
  );
});
