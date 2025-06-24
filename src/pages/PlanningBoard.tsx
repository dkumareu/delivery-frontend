import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import api from "../utils/axios";

interface Driver {
  _id: string;
  name: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  driverNumber: string;
  email?: string;
  mobileNumber?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    id: string;
    name: string;
  };
  status: string;
  startDate: string;
  endDate: string;
  assignedDriver?: Driver;
}

const PlanningBoard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    fetchDrivers();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [selectedDate]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<Order[]>("/orders", {
        params: {
          date: format(selectedDate, "yyyy-MM-dd"),
          allOrders: true,
        },
      });
      setOrders(response.data);
    } catch (error) {
      // Error will be automatically shown by axios interceptor
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const fetchDrivers = useCallback(async () => {
    try {
      const response = await api.get<Driver[]>("/drivers");
      setDrivers(response.data);
    } catch (error) {
      // Error will be automatically shown by axios interceptor
    }
  }, []);

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleAssignDriver = useCallback(
    async (orderId: string, driverId: string) => {
      try {
        await api.patch(`/orders/${orderId}`, { driver: driverId });
        fetchOrders();
      } catch (error) {
        // Error will be automatically shown by axios interceptor
      }
    },
    [fetchOrders]
  );

  const handleDriverChange = (
    _event: React.SyntheticEvent,
    value: Driver | null
  ) => {
    setSelectedDriver(value);
  };

  const handleSaveAssignment = async () => {
    if (!selectedOrder || !selectedDriver) return;

    try {
      await api.patch(`/orders/${selectedOrder._id}`, {
        assignedDriver: selectedDriver._id,
      });
      fetchOrders();
      setOpenDialog(false);
      setSelectedDriver(null);
      setSelectedOrder(null);
    } catch (error) {
      // Error will be automatically shown by axios interceptor
    }
  };

  const filteredOrders = orders.filter((order) => {
    const orderDate = new Date(order.startDate);
    return (
      orderDate.getDate() === selectedDate.getDate() &&
      orderDate.getMonth() === selectedDate.getMonth() &&
      orderDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Planning Board
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: 3 }}>
        <Paper sx={{ p: 2, width: "100%" }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateCalendar
              value={selectedDate}
              onChange={handleDateChange}
              sx={{
                width: "100%",
                "& .MuiPickersCalendarHeader-root": { width: "100%" },
              }}
            />
          </LocalizationProvider>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Orders for {format(selectedDate, "MMMM d, yyyy")}
          </Typography>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : filteredOrders.length === 0 ? (
            <Typography color="text.secondary">
              No orders scheduled for this date
            </Typography>
          ) : (
            filteredOrders.map((order) => (
              <Paper
                key={order._id}
                sx={{
                  p: 2,
                  mb: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography variant="subtitle1">
                    Order #{order.orderNumber}
                  </Typography>
                  <Typography color="text.secondary">
                    Customer: {order.customer.name}
                  </Typography>
                  <Typography color="text.secondary">
                    Driver:{" "}
                    {order.assignedDriver
                      ? `${order.assignedDriver.name} (${order.assignedDriver.driverNumber})`
                      : "Not assigned"}
                  </Typography>
                </Box>
                {!order.assignedDriver && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSelectedOrder(order);
                      setOpenDialog(true);
                    }}
                  >
                    Assign Driver
                  </Button>
                )}
              </Paper>
            ))
          )}
        </Paper>
      </Box>

      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setSelectedDriver(null);
          setSelectedOrder(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Driver</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, minWidth: 400 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Assigning driver to Order #{selectedOrder?.orderNumber} -{" "}
              {selectedOrder?.customer.name}
            </Typography>
            <Autocomplete
              id="driver-select"
              options={drivers}
              getOptionLabel={(option) =>
                `${option.name} (Driver #${option.driverNumber})`
              }
              value={selectedDriver}
              onChange={handleDriverChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Driver"
                  placeholder="Search by name, number, email or mobile..."
                  variant="outlined"
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <div>
                    <strong>{option.name}</strong>
                    <br />
                    <small>Driver #{option.driverNumber}</small>
                    {option.email && <br />}
                    {option.email && <small>{option.email}</small>}
                    {option.mobileNumber && <br />}
                    {option.mobileNumber && (
                      <small>{option.mobileNumber}</small>
                    )}
                  </div>
                </li>
              )}
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenDialog(false);
              setSelectedDriver(null);
              setSelectedOrder(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveAssignment}
            variant="contained"
            disabled={!selectedDriver}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlanningBoard;
