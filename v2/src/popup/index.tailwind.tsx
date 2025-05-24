import React from "react";
import * as ReactDOM from "react-dom/client";
import { App } from "./App.tailwind";
import { Providers } from "~/components/providers";
import "~/globals.css";
import { Toaster } from "~/components/ui/toaster";

const rootElement = document.getElementById("root");

rootElement &&
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Providers>
        <App />
        <Toaster />
      </Providers>
    </React.StrictMode>
  );
