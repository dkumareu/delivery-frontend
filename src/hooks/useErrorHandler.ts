import { useState, useCallback } from "react";

interface ErrorState {
  message: string;
  severity: "error" | "warning" | "info";
  open: boolean;
}

export const useErrorHandler = () => {
  const [error, setError] = useState<ErrorState>({
    message: "",
    severity: "error",
    open: false,
  });

  const handleError = useCallback(
    (error: any, defaultMessage = "An error occurred") => {
      console.error("Error:", error);

      let message = defaultMessage;
      let severity: "error" | "warning" | "info" = "error";

      // Handle our standardized error format from axios interceptor
      if (error.message) {
        message = error.message;
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.response?.data?.error) {
        message = error.response.data.error;
      } else if (typeof error === "string") {
        message = error;
      }

      // Determine severity based on status code
      if (error.status) {
        if (error.status >= 500) {
          severity = "error";
        } else if (error.status >= 400) {
          severity = "warning";
        } else {
          severity = "info";
        }
      }

      setError({
        message,
        severity,
        open: true,
      });
    },
    []
  );

  const clearError = useCallback(() => {
    setError((prev) => ({ ...prev, open: false }));
  }, []);

  const showError = useCallback(
    (message: string, severity: "error" | "warning" | "info" = "error") => {
      setError({
        message,
        severity,
        open: true,
      });
    },
    []
  );

  return {
    error,
    handleError,
    clearError,
    showError,
  };
};
