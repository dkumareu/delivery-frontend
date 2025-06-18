import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import {
  ThemeProvider,
  CssBaseline,
  CircularProgress,
  Box,
} from "@mui/material";
import { theme } from "./theme";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerDetails from "./pages/CustomerDetails";
import Items from "./pages/Items";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import PlanningBoard from "./pages/PlanningBoard";
import Drivers from "./pages/Drivers";
import AssignDriver from "./pages/AssignDriver";
import { AuthProvider, useAuth } from "./context/AuthContext";

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <PrivateRoute>
                  <Layout>
                    <Customers />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/customers/:id"
              element={
                <PrivateRoute>
                  <Layout>
                    <CustomerDetails />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/items"
              element={
                <PrivateRoute>
                  <Layout>
                    <Items />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <PrivateRoute>
                  <Layout>
                    <Orders />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <PrivateRoute>
                  <Layout>
                    <OrderDetails />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/planning"
              element={
                <PrivateRoute>
                  <Layout>
                    <PlanningBoard />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/drivers"
              element={
                <PrivateRoute>
                  <Layout>
                    <Drivers />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/assign-driver"
              element={
                <PrivateRoute>
                  <Layout>
                    <AssignDriver />
                  </Layout>
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
