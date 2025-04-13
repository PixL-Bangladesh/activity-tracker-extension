import React from 'react';
import * as ReactDOM from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { Providers } from '~/components/providers';
import App from './App.tailwind';
import '~/globals.css';

const rootElement = document.getElementById('root');
const router = createHashRouter([
  {
    path: '/*',
    element: <App />,
  },
]);

rootElement &&
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </React.StrictMode>,
  );
