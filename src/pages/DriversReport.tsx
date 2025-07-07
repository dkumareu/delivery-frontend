import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Print as PrintIcon,
} from "@mui/icons-material";
import api from "../utils/axios";

interface Driver {
  _id: string;
  driverNumber: string;
  name: string;
  status: string;
  latitude?: number;
  longitude?: number;
}

interface Customer {
  _id: string;
  customerNumber: string;
  name: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  mobileNumber?: string;
  email?: string;
  latitude: number;
  longitude: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  customer: Customer;
  startDate?: string;
  endDate?: string;
  frequency?: string;
  status: string;
  assignedDriver?: Driver;
  deliverySequence?: number;
  amount?: string;
  totalGrossAmount?: number;
  paymentMethod?: string;
  driverNote?: string;
}

const DriversReport: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  // Generate month options for the last 12 months
  const monthOptions = useCallback(() => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      options.push({ value, label });
    }
    
    return options;
  }, []);

  // Fetch drivers
  const fetchDrivers = useCallback(async () => {
    try {
      const response = await api.get<Driver[]>("/drivers");
      setDrivers(response.data);
    } catch (error) {
      // Error will be automatically shown by axios interceptor
    }
  }, []);

  // Fetch orders for selected driver and month
  const fetchOrders = useCallback(async () => {
    if (!selectedDriver || !selectedMonth) return;

    try {
      setReportLoading(true);
      const [year, month] = selectedMonth.split('-');
      const response = await api.get<Order[]>(
        `/orders?driver=${selectedDriver._id}&year=${year}&month=${month}&allOrders=true`
      );
      setOrders(response.data);
    } catch (error) {
      // Error will be automatically shown by axios interceptor
    } finally {
      setReportLoading(false);
    }
  }, [selectedDriver, selectedMonth]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  useEffect(() => {
    if (selectedDriver && selectedMonth) {
      fetchOrders();
    }
  }, [selectedDriver, selectedMonth, fetchOrders]);

  const handleGenerateReport = () => {
    if (selectedDriver && selectedMonth) {
      fetchOrders();
    }
  };

  const downloadReport = useCallback(() => {
    if (!selectedDriver || !selectedMonth || orders.length === 0) return;

    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const monthLabel = new Date(selectedMonth + '-01').toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });

    // Create HTML content for PDF
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Driver Report - ${selectedDriver.name} - ${monthLabel}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .section h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            .info-row { margin: 5px 0; }
            .info-label { font-weight: bold; display: inline-block; width: 150px; }
            .table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f2f2f2; }
            .total-row { font-weight: bold; background-color: #f9f9f9; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            .summary-info { background-color: #f0f8ff; padding: 10px; border-radius: 5px; margin: 10px 0; }
            .driver-note { margin: 5px 0; padding: 5px; background-color: #f9f9f9; border-left: 3px solid #007acc; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DRIVER REPORT</h1>
            <h2>${selectedDriver.name} - ${monthLabel}</h2>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>

          <div class="section">
            <h3>Driver Information</h3>
            <div class="info-row">
              <span class="info-label">Driver Name:</span>
              <span>${selectedDriver.name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Driver Number:</span>
              <span>${selectedDriver.driverNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Report Period:</span>
              <span>${monthLabel}</span>
            </div>
          </div>

          <div class="section">
            <h3>Summary</h3>
            <div class="summary-info">
              <div class="info-row">
                <span class="info-label">Total Orders:</span>
                <span>${orders.length}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Total Amount:</span>
                <span>€${orders.reduce((sum, order) => sum + (order.totalGrossAmount || 0), 0).toFixed(2)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Completed Orders:</span>
                <span>${orders.filter(order => order.status === 'completed').length}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Pending Orders:</span>
                <span>${orders.filter(order => order.status === 'pending').length}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Order Details</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Order #</th>
                  <th>Customer Name</th>
                  <th>Address</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${orders.map((order) => {
                  const customer = order.customer;
                  const address = `${customer.street} ${customer.houseNumber}, ${customer.postalCode} ${customer.city}`;
                  const mobile = customer.mobileNumber || 'N/A';
                  const email = customer.email || 'N/A';
                  const amount = order.totalGrossAmount ? `€${order.totalGrossAmount.toFixed(2)}` : 'N/A';
                  const status = order.status || 'N/A';
                  const paymentMethod = order.paymentMethod ? ` (${order.paymentMethod.replace('_', ' ').toUpperCase()})` : '';
                  const orderDate = order.startDate ? new Date(order.startDate).toLocaleDateString() : 'N/A';

                  return `
                    <tr>
                      <td>${orderDate}</td>
                      <td>${order.orderNumber}</td>
                      <td>${customer.name}</td>
                      <td>${address}</td>
                      <td>${mobile}</td>
                      <td>${email}</td>
                      <td>${amount}${paymentMethod}</td>
                      <td>${status}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>This report was generated automatically from the delivery management system.</p>
            <p>Total Orders: ${orders.length}</p>
          </div>
        </body>
      </html>
    `;

    // Open in new window and trigger print
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  }, [selectedDriver, selectedMonth, orders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "in_progress":
        return "info";
      case "completed":
        return "success";
      case "cancelled":
        return "error";
      case "paused":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ p: 3, height: "100vh", display: "flex", flexDirection: "column" }}>
      <Typography variant="h4" gutterBottom>
        Drivers Report
      </Typography>

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            alignItems: "center",
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <FormControl fullWidth>
              <InputLabel>Select Driver</InputLabel>
              <Select
                value={selectedDriver?._id || ""}
                onChange={(e) => {
                  const driver = drivers.find(
                    (d) => d._id === e.target.value
                  );
                  setSelectedDriver(driver || null);
                }}
                label="Select Driver"
              >
                {drivers.map((driver) => (
                  <MenuItem key={driver._id} value={driver._id}>
                    {driver.name} (Driver #{driver.driverNumber})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <FormControl fullWidth>
              <InputLabel>Select Month</InputLabel>
              <Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                label="Select Month"
              >
                {monthOptions().map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        {selectedDriver && selectedMonth && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={handleGenerateReport}
              disabled={!selectedDriver || !selectedMonth}
            >
              Generate Report
            </Button>
          </Box>
        )}
      </Paper>

      {/* Report Summary */}
      {selectedDriver && selectedMonth && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Driver:</strong> {selectedDriver.name} |
                <strong> Month:</strong> {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long' 
                })} |
                <strong> Orders:</strong> {orders.length}
              </Typography>
            </Box>
            {orders.length > 0 && (
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={downloadReport}
                size="small"
              >
                Download PDF
              </Button>
            )}
          </Box>
        </Paper>
      )}

      {/* Report Content */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {reportLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : orders.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">
              {selectedDriver && selectedMonth 
                ? "No orders found for selected driver and month"
                : "Please select a driver and month to generate report"
              }
            </Typography>
          </Paper>
        ) : (
          <Paper sx={{ p: 2 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Order #</TableCell>
                    <TableCell>Customer Name</TableCell>
                    <TableCell>Address</TableCell>
                    <TableCell>Mobile</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => {
                    const customer = order.customer;
                    const address = `${customer.street} ${customer.houseNumber}, ${customer.postalCode} ${customer.city}`;
                    const mobile = customer.mobileNumber || 'N/A';
                    const email = customer.email || 'N/A';
                    const amount = order.totalGrossAmount ? `€${order.totalGrossAmount.toFixed(2)}` : 'N/A';
                    const status = order.status || 'N/A';
                    const paymentMethod = order.paymentMethod ? ` (${order.paymentMethod.replace('_', ' ').toUpperCase()})` : '';
                    const orderDate = order.startDate ? new Date(order.startDate).toLocaleDateString() : 'N/A';

                    return (
                      <TableRow key={order._id}>
                        <TableCell>{orderDate}</TableCell>
                        <TableCell>{order.orderNumber}</TableCell>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>{address}</TableCell>
                        <TableCell>{mobile}</TableCell>
                        <TableCell>{email}</TableCell>
                        <TableCell>{amount}{paymentMethod}</TableCell>
                        <TableCell>
                          <Chip
                            label={status.replace("_", " ").toUpperCase()}
                            color={getStatusColor(status)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default DriversReport; 