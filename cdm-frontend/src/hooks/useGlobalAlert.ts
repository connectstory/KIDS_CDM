import { useContext } from "react";
import { AlertContext } from "../components/alert/AlertContext";

export function useGlobalAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useGlobalAlert must be used within AlertProvider");
  return ctx;
}
