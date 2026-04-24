import { RouterProvider } from "react-router-dom";
import "./App.css";
import { router } from "./router/Router";

function App() {
  return (
    <div translate="no" className="notranslate" style={{ minHeight: "100%" }}>
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
