import React from "react";
import { Alert, AlertTitle, Collapse, IconButton } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

interface ErrorAlertProps {
  error: {
    message: string;
    severity: "error" | "warning" | "info";
    open: boolean;
  };
  onClose: () => void;
  title?: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ error, onClose, title }) => {
  if (!error.open || !error.message) {
    return null;
  }

  return (
    <Collapse in={error.open}>
      <Alert
        severity={error.severity}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={onClose}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
        sx={{ mb: 2 }}
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        {error.message}
      </Alert>
    </Collapse>
  );
};

export default ErrorAlert;
