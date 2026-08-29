import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
import "./resume/base.css";
import "./resume/themes/classic.css";
import "./resume/themes/modern.css";
import "./resume/themes/compact.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
