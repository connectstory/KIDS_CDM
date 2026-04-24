// import {StrictMode} from "react";
import { ThemeProvider } from "@emotion/react";
import { CssBaseline } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { enableMapSet } from "immer";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App.tsx";
import { AlertContainer } from "./components/alert/AlertContainer.tsx";
import "@/constants/i18n/i18n";
import "./index.css";
import { store } from "./store";
import { theme } from "./theme";
import "@/assets/css/admin/index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

enableMapSet();

// 배포 후 캐시된 청크 해시 불일치 시 자동 새로고침
window.addEventListener("vite:preloadError", () => {
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <QueryClientProvider client={queryClient}>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AlertContainer>
          <App />
        </AlertContainer>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </Provider>
  </QueryClientProvider>
  // {/* </StrictMode> */}
);
