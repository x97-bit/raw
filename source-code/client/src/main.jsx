import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { applyTheme, readInitialTheme } from "./contexts/ThemeContext";
import "./index.css";

applyTheme(readInitialTheme());

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
