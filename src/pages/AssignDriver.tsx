import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
  Autocomplete,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import api from "../utils/axios";

interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    name: string;
    customerNumber: string;
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    email?: string;
    mobileNumber?: string;
  };
  startDate?: string;
  endDate?: string;
  frequency?: string;
  status: string;
  createdAt: string;
}

interface Driver {
  _id: string;
  driverNumber: string;
  name: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  mobileNumber?: string;
  email?: string;
  status: string;
  vacationStartDate?: string;
  vacationEndDate?: string;
}

const AssignDriver: React.FC = () => {
  const [unassignedOrders, setUnassignedOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [ordersRes, driversRes] = await Promise.all([
        api.get<Order[]>("/orders/unassigned"),
        api.get<Driver[]>("/drivers"),
      ]);
      setUnassignedOrders(ordersRes.data);
      setDrivers(driversRes.data);
    } catch (error) {
      // Error will be automatically shown by axios interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDriverSelect = (
    _event: React.SyntheticEvent,
    value: Driver | null
  ) => {
    setSelectedDriver(value);
  };

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleAssign = async () => {
    if (!selectedDriver || selectedOrders.length === 0) {
      showSnackbar("Please select a driver and at least one order", "error");
      return;
    }

    try {
      await api.post("/orders/assign-driver", {
        driverId: selectedDriver._id,
        orderIds: selectedOrders,
      });
      showSnackbar("Orders assigned successfully", "success");
      setSelectedDriver(null);
      setSelectedOrders([]);
      fetchData();
    } catch (error) {
      // Error will be automatically shown by axios interceptor
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Assign Orders to Drivers
      </Typography>
      <Stack spacing={3}>
        {/* Driver Selection */}
        <Paper elevation={3} sx={{ p: 2 }}>
          <Autocomplete
            id="driver-select"
            options={drivers}
            getOptionLabel={(option) =>
              `${option.name} (Driver #${option.driverNumber})`
            }
            value={selectedDriver}
            onChange={handleDriverSelect}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Driver"
                placeholder="Search by name, number, email or mobile..."
                variant="outlined"
              />
            )}
            renderOption={(props, option) => {
              const { key, ...otherProps } = props;
              return (
                <li key={key} {...otherProps}>
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {option.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Driver #{option.driverNumber}
                    </Typography>
                    {option.email && (
                      <Typography variant="body2" color="text.secondary">
                        {option.email}
                      </Typography>
                    )}
                    {option.mobileNumber && (
                      <Typography variant="body2" color="text.secondary">
                        {option.mobileNumber}
                      </Typography>
                    )}
                  </Box>
                </li>
              );
            }}
            loading={loading}
            loadingText="Loading drivers..."
            noOptionsText="No drivers found"
            filterOptions={(options, { inputValue }) => {
              const searchTerm = inputValue.toLowerCase();
              return options.filter((option) => {
                const searchableFields = [
                  option.name,
                  option.driverNumber,
                  option.email,
                  option.mobileNumber,
                  option.city,
                ].filter((field): field is string => Boolean(field));

                return searchableFields.some((field) =>
                  field.toLowerCase().includes(searchTerm)
                );
              });
            }}
          />
        </Paper>

        {/* Unassigned Orders */}
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Unassigned Orders
          </Typography>
          {unassignedOrders.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
              No unassigned orders available
            </Typography>
          ) : (
            <List>
              {unassignedOrders.map((order) => (
                <ListItem
                  key={order._id}
                  sx={{
                    mb: 1,
                    bgcolor: selectedOrders.includes(order._id)
                      ? "action.selected"
                      : "background.paper",
                    borderRadius: 1,
                    boxShadow: 1,
                    cursor: "pointer",
                    "&:hover": {
                      bgcolor: "action.hover",
                    },
                  }}
                  onClick={() => handleOrderSelect(order._id)}
                >
                  <ListItemText
                    primary={
                      <>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Order #{order.orderNumber}
                        </Typography>
                        <Typography variant="subtitle2" color="primary">
                          {order.customer.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {order.startDate && (
                            <>
                              <strong>Delivery:</strong>{" "}
                              {new Date(order.startDate).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "short",
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                              {order.frequency && (
                                <>
                                  {" "}
                                  •{" "}
                                  {order.frequency.charAt(0).toUpperCase() +
                                    order.frequency.slice(1)}
                                </>
                              )}
                            </>
                          )}
                        </Typography>
                      </>
                    }
                    secondary={
                      <>
                        <Typography
                          variant="body2"
                          component="span"
                          display="block"
                        >
                          <strong>Address:</strong> {order.customer.street}{" "}
                          {order.customer.houseNumber},{" "}
                          {order.customer.postalCode} {order.customer.city}
                        </Typography>
                        <Typography
                          variant="body2"
                          component="span"
                          display="block"
                        >
                          <strong>Customer #:</strong>{" "}
                          {order.customer.customerNumber}
                        </Typography>
                        {order.customer.email && (
                          <Typography
                            variant="body2"
                            component="span"
                            display="block"
                          >
                            <strong>Email:</strong> {order.customer.email}
                          </Typography>
                        )}
                        {order.customer.mobileNumber && (
                          <Typography
                            variant="body2"
                            component="span"
                            display="block"
                          >
                            <strong>Phone:</strong>{" "}
                            {order.customer.mobileNumber}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>

        {/* Assign Button */}
        <Button
          variant="contained"
          color="primary"
          onClick={handleAssign}
          disabled={!selectedDriver || selectedOrders.length === 0}
          fullWidth
        >
          Assign Selected Orders
        </Button>
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AssignDriver;
