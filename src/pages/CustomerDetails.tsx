import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/axios";
import { Customer as CustomerType } from "../types/customer";

enum OrderStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  PAUSED = "paused",
}

interface Order {
  _id: string;
  orderNumber: string;
  status: OrderStatus;
  startDate: string;
  endDate?: string;
  totalNetAmount: number;
  totalGrossAmount: number;
}

interface Customer extends Omit<CustomerType, "orders"> {
  orders?: Order[];
}

const statusColors = {
  [OrderStatus.PENDING]: "warning",
  [OrderStatus.IN_PROGRESS]: "info",
  [OrderStatus.COMPLETED]: "success",
  [OrderStatus.CANCELLED]: "error",
  [OrderStatus.PAUSED]: "default",
} as const;

const CustomerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    fetchCustomer();
    fetchCustomerOrders();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      const response = await api.get<Customer>(`/customers/${id}`);
      setCustomer(response.data);
    } catch (error) {
      console.error("Error fetching customer:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerOrders = async () => {
    try {
      const response = await api.get<Order[]>(`/customers/${id}/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching customer orders:", error);
    } finally {
      setOrdersLoading(false);
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

  if (!customer) {
    return (
      <Typography color="error">Error loading customer details</Typography>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/customers")}
        >
          Back to Customers
        </Button>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            Customer Information
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Customer Number
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {customer.customerNumber}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Name
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {customer.name}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {customer.email}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Mobile
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {customer.mobileNumber}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Address
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {customer.street} {customer.houseNumber}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                City
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {customer.city}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Postal Code
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {customer.postalCode}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Status
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={customer.status.replace("_", " ").toUpperCase()}
                  color={customer.status === "active" ? "success" : "error"}
                  size="small"
                />
              </Box>
            </Box>

            <Box>
              {customer.vacationStartDate && customer.vacationEndDate && (
                <>
                  <Typography variant="subtitle2" color="text.secondary">
                    Vacation Start
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {new Date(customer.vacationStartDate).toLocaleDateString()}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary">
                    Vacation End
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {new Date(customer.vacationEndDate).toLocaleDateString()}
                  </Typography>
                </>
              )}

              <Typography variant="subtitle2" color="text.secondary">
                Created
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {new Date(customer.createdAt).toLocaleDateString()}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Last Updated
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {new Date(customer.updatedAt).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            Recent Orders
          </Typography>
          {ordersLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : orders.length === 0 ? (
            <Typography color="text.secondary">
              No orders found for this customer
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order Number</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow
                      key={order._id}
                      hover
                      onClick={() =>
                        navigate(`/orders/${order._id}`, {
                          state: { from: "customer" },
                        })
                      }
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell>{order.orderNumber}</TableCell>
                      <TableCell>
                        <Chip
                          label={order.status.replace("_", " ").toUpperCase()}
                          color={statusColors[order.status]}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(order.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {order.endDate
                          ? new Date(order.endDate).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell align="right">
                        €{order.totalGrossAmount.toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/orders/${order._id}`, {
                              state: { from: "customer" },
                            });
                          }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default CustomerDetails;
