import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import api from "../utils/axios";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  // Don't render login form if still loading or already authenticated
  if (loading || isAuthenticated) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setFormLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate("/");
    } catch (error) {
      setError("Invalid email or password");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 400,
        }}
      >
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Login
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            margin="normal"
            required
            autoFocus
          />
          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            margin="normal"
            required
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            disabled={formLoading}
          >
            {formLoading ? <CircularProgress size={24} /> : "Login"}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;
