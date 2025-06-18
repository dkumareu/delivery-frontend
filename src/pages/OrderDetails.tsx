import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon,
} from "@mui/icons-material";
import api from "../utils/axios";

enum PaymentMethod {
  CASH = "cash",
  BANK_TRANSFER = "bank_transfer",
  DIRECT_DEBIT = "direct_debit",
  DELIVERY_NOTE = "delivery_note",
}

enum OrderStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  PAUSED = "paused",
}

enum Frequency {
  DAILY = "daily",
  WEEKDAYS = "weekdays",
  WEEKLY = "weekly",
  BIWEEKLY = "biweekly",
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  SEMI_ANNUALLY = "semi_annually",
  ANNUALLY = "annually",
}

enum VatRate {
  NONE = 0,
  REDUCED = 7,
  STANDARD = 19,
}

interface OrderItem {
  item: {
    _id: string;
    filterType: string;
    length: number;
    width: number;
    depth: number;
    unitOfMeasure: string;
  };
  quantity: number;
  unitPrice: number;
  vatRate: VatRate;
  netAmount: number;
  grossAmount: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    _id: string;
    customerNumber: string;
    name: string;
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    email?: string;
    mobileNumber?: string;
  };
  items: OrderItem[];
  paymentMethod: PaymentMethod;
  driverNote?: string;
  startDate: string;
  endDate?: string;
  frequency?: Frequency;
  status: OrderStatus;
  totalNetAmount: number;
  totalGrossAmount: number;
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  [OrderStatus.PENDING]: "warning",
  [OrderStatus.IN_PROGRESS]: "info",
  [OrderStatus.COMPLETED]: "success",
  [OrderStatus.CANCELLED]: "error",
  [OrderStatus.PAUSED]: "default",
} as const;

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get<Order>(`/orders/${id}`);
        setOrder(response.data);
        setCustomerId(response.data.customer._id);
      } catch (error) {
        console.error("Error fetching order:", error);
        setError("Failed to fetch order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleBack = () => {
    if (customerId && location.state?.from === "customer") {
      navigate(`/customers/${customerId}`);
    } else {
      navigate("/orders");
    }
  };

  const handlePrint = () => {
    if (!order) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order Manifest - ${order.orderNumber}</title>
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
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ORDER MANIFEST</h1>
            <h2>${order.orderNumber}</h2>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>

          <div class="section">
            <h3>Order Information</h3>
            <div class="info-row">
              <span class="info-label">Order Number:</span>
              <span>${order.orderNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span>${order.status.replace("_", " ").toUpperCase()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment Method:</span>
              <span>${order.paymentMethod
                .replace("_", " ")
                .toUpperCase()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Start Date:</span>
              <span>${new Date(order.startDate).toLocaleDateString()}</span>
            </div>
            ${
              order.endDate
                ? `
            <div class="info-row">
              <span class="info-label">End Date:</span>
              <span>${new Date(order.endDate).toLocaleDateString()}</span>
            </div>
            `
                : ""
            }
            ${
              order.frequency
                ? `
            <div class="info-row">
              <span class="info-label">Frequency:</span>
              <span>${order.frequency.replace("_", " ").toUpperCase()}</span>
            </div>
            `
                : ""
            }
            ${
              order.driverNote
                ? `
            <div class="info-row">
              <span class="info-label">Driver Note:</span>
              <span>${order.driverNote}</span>
            </div>
            `
                : ""
            }
          </div>

          <div class="section">
            <h3>Customer Information</h3>
            <div class="info-row">
              <span class="info-label">Customer Number:</span>
              <span>${order.customer.customerNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Name:</span>
              <span>${order.customer.name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Address:</span>
              <span>${order.customer.street} ${order.customer.houseNumber}, ${
      order.customer.postalCode
    } ${order.customer.city}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span>${order.customer.email}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Phone:</span>
              <span>${order.customer.mobileNumber}</span>
            </div>
          </div>

          <div class="section">
            <h3>Order Items</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>VAT Rate</th>
                  <th>Net Amount</th>
                  <th>Gross Amount</th>
                </tr>
              </thead>
              <tbody>
                ${order.items
                  .map(
                    (item) => `
                  <tr>
                    <td>${item.item.filterType} (${item.item.length}×${
                      item.item.width
                    }×${item.item.depth} ${item.item.unitOfMeasure})</td>
                    <td>${item.quantity}</td>
                    <td>€${item.unitPrice.toFixed(2)}</td>
                    <td>${item.vatRate}%</td>
                    <td>€${item.netAmount.toFixed(2)}</td>
                    <td>€${item.grossAmount.toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join("")}
                <tr class="total-row">
                  <td colspan="4"></td>
                  <td><strong>Total Net Amount:</strong></td>
                  <td><strong>€${order.totalNetAmount.toFixed(2)}</strong></td>
                </tr>
                <tr class="total-row">
                  <td colspan="4"></td>
                  <td><strong>Total Gross Amount:</strong></td>
                  <td><strong>€${order.totalGrossAmount.toFixed(
                    2
                  )}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>This manifest was generated automatically from the order management system.</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !order) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography color="error">{error || "Order not found"}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back to{" "}
          {customerId && location.state?.from === "customer"
            ? "Customer"
            : "Orders"}
        </Button>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          sx={{ ml: 2 }}
        >
          Print Manifest
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Order Information
            </Typography>
            <Typography>
              <strong>Order Number:</strong> {order.orderNumber}
            </Typography>
            <Typography>
              <strong>Status:</strong>{" "}
              <Chip
                label={order.status.replace("_", " ").toUpperCase()}
                color={statusColors[order.status]}
                size="small"
              />
            </Typography>
            <Typography>
              <strong>Payment Method:</strong>{" "}
              {order.paymentMethod.replace("_", " ").toUpperCase()}
            </Typography>
            <Typography>
              <strong>Start Date:</strong>{" "}
              {new Date(order.startDate).toLocaleDateString()}
            </Typography>
            {order.endDate && (
              <Typography>
                <strong>End Date:</strong>{" "}
                {new Date(order.endDate).toLocaleDateString()}
              </Typography>
            )}
            {order.frequency && (
              <Typography>
                <strong>Frequency:</strong>{" "}
                {order.frequency.replace("_", " ").toUpperCase()}
              </Typography>
            )}
            {order.driverNote && (
              <Typography>
                <strong>Driver Note:</strong> {order.driverNote}
              </Typography>
            )}
          </Box>
          <Box>
            <Typography variant="h6" gutterBottom>
              Customer Information
            </Typography>
            <Typography>
              <strong>Customer Number:</strong> {order.customer.customerNumber}
            </Typography>
            <Typography>
              <strong>Name:</strong> {order.customer.name}
            </Typography>
            <Typography>
              <strong>Address:</strong> {order.customer.street}{" "}
              {order.customer.houseNumber}, {order.customer.postalCode}{" "}
              {order.customer.city}
            </Typography>
            <Typography>
              <strong>Email:</strong> {order.customer.email}
            </Typography>
            <Typography>
              <strong>Phone:</strong> {order.customer.mobileNumber}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Order Items
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="right">VAT Rate</TableCell>
                <TableCell align="right">Net Amount</TableCell>
                <TableCell align="right">Gross Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {order.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {item.item.filterType} ({item.item.length}×{item.item.width}
                    ×{item.item.depth} {item.item.unitOfMeasure})
                  </TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">
                    €{item.unitPrice.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">{item.vatRate}%</TableCell>
                  <TableCell align="right">
                    €{item.netAmount.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    €{item.grossAmount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={4} />
                <TableCell align="right">
                  <strong>Total Net Amount:</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>€{order.totalNetAmount.toFixed(2)}</strong>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={4} />
                <TableCell align="right">
                  <strong>Total Gross Amount:</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>€{order.totalGrossAmount.toFixed(2)}</strong>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default OrderDetails;
