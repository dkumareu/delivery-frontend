import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
} from "@mui/material";
import api from "../utils/axios";

interface DashboardStats {
  totalOrders: number;
  totalCustomers: number;
  totalItems: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // const response = await api.get<DashboardStats>("/dashboard/stats");
      // setStats(response.data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Box
        sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3 }}
      >
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Total Orders
            </Typography>
            <Typography variant="h4">{stats?.totalOrders}</Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Total Customers
            </Typography>
            <Typography variant="h4">{stats?.totalCustomers}</Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Total Items
            </Typography>
            <Typography variant="h4">{stats?.totalItems}</Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Dashboard;
