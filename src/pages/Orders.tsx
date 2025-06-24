import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import {
  DataGrid,
  GridColDef,
  GridRowParams,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import api from "../utils/axios";
import { useAuth } from "../context/AuthContext";
import { Customer } from "../types/customer";
import { Item } from "../types/item";
import { Order, OrderStatus, PaymentMethod, Frequency } from "../types/order";
import OrderDialog from "../components/OrderDialog";

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [openCustomerDialog, setOpenCustomerDialog] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchItems();
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await api.get<Order[]>("/orders");
      setOrders(response.data);
    } catch (error) {
      // Error will be automatically shown by axios interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await api.get<Customer[]>("/customers");
      setCustomers(response.data);
    } catch (error) {
      // Error will be automatically shown by axios interceptor
    }
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      const response = await api.get<Item[]>("/items");
      setItems(response.data);
    } catch (error) {
      // Error will be automatically shown by axios interceptor
    }
  }, []);

  const handleOpenDialog = useCallback((order?: Order) => {
    if (order) {
      setSelectedOrder(order);
    } else {
      setSelectedOrder(null);
    }
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setSelectedOrder(null);
  }, []);

  const handleSubmit = useCallback(
    async (orderData: any) => {
      try {
        if (selectedOrder) {
          await api.patch(`/orders/${selectedOrder._id}`, orderData);
        } else {
          await api.post("/orders", orderData);
        }
        fetchOrders();
        handleCloseDialog();
      } catch (error) {
        // Error will be automatically shown by axios interceptor
      }
    },
    [selectedOrder, fetchOrders, handleCloseDialog]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (window.confirm("Are you sure you want to delete this order?")) {
        try {
          await api.delete(`/orders/${id}`);
          fetchOrders();
        } catch (error) {
          // Error will be automatically shown by axios interceptor
        }
      }
    },
    [fetchOrders]
  );

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return "warning";
      case OrderStatus.IN_PROGRESS:
        return "info";
      case OrderStatus.COMPLETED:
        return "success";
      case OrderStatus.CANCELLED:
        return "error";
      case OrderStatus.PAUSED:
        return "default";
      default:
        return "default";
    }
  };

  const columns: GridColDef[] = useMemo(
    () => [
      { field: "orderNumber", headerName: "Order Number", flex: 1 },
      {
        field: "customer",
        headerName: "Customer",
        flex: 1,
        renderCell: (params: GridRenderCellParams<Order>) => {
          const customer = params.row.customer;
          return (
            <Typography>
              {customer
                ? `${customer.customerNumber} - ${customer.name}`
                : "N/A"}
            </Typography>
          );
        },
      },
      {
        field: "startDate",
        headerName: "Start Date",
        flex: 1,
        renderCell: (params: GridRenderCellParams<Order>) => {
          return (
            <Typography>
              {params.row.startDate
                ? new Date(params.row.startDate).toLocaleDateString()
                : "N/A"}
            </Typography>
          );
        },
      },
      {
        field: "frequency",
        headerName: "Frequency",
        width: 120,
        renderCell: (params: GridRenderCellParams<Order>) => {
          return (
            <Typography>
              {params.row.frequency
                ? params.row.frequency.replace("_", " ").toUpperCase()
                : "N/A"}
            </Typography>
          );
        },
      },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        renderCell: (params: GridRenderCellParams<Order>) => {
          const status = params.row.status;
          return (
            <Chip
              label={status ? status.replace("_", " ").toUpperCase() : "N/A"}
              color={getStatusColor(status as OrderStatus)}
              size="small"
            />
          );
        },
      },
      {
        field: "totalGrossAmount",
        headerName: "Total",
        width: 120,
        renderCell: (params: GridRenderCellParams<Order>) => {
          return (
            <Typography>
              {params.row.totalGrossAmount
                ? `€${params.row.totalGrossAmount.toFixed(2)}`
                : "€0.00"}
            </Typography>
          );
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 150,
        renderCell: (params: GridRenderCellParams<Order>) => {
          const row = params.row;
          return (
            <Box>
              <IconButton
                size="small"
                onClick={() => navigate(`/orders/${row._id}`)}
                color="primary"
              >
                <ViewIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleOpenDialog(row)}
                color="primary"
              >
                <EditIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleDelete(row._id)}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          );
        },
      },
    ],
    [handleOpenDialog, navigate, handleDelete]
  );

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) =>
        Object.values(order).some((value) =>
          value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
      ),
    [orders, searchQuery]
  );

  return (
    <Box sx={{ height: "100%", width: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5" component="h1">
          Orders
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Order
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <Paper sx={{ height: "calc(100% - 120px)" }}>
        <DataGrid<Order>
          rows={filteredOrders}
          columns={columns}
          getRowId={(row) => row._id}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
          }}
          pageSizeOptions={[10]}
          checkboxSelection
          disableRowSelectionOnClick
          loading={loading}
          autoHeight
          sx={{
            "& .MuiDataGrid-cell": {
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            },
          }}
        />
      </Paper>

      <OrderDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        selectedOrder={selectedOrder}
        customers={customers}
        items={items}
        onAddCustomer={() => setOpenCustomerDialog(true)}
      />

      {/* Customer Creation Dialog */}
      <Dialog
        open={openCustomerDialog}
        onClose={() => setOpenCustomerDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add New Customer</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
              <TextField
                fullWidth
                label="Customer Number"
                name="customerNumber"
                required
              />
            </Box>
            <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
              <TextField fullWidth label="Name" name="name" required />
            </Box>
            <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
              <TextField fullWidth label="Street" name="street" required />
            </Box>
            <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
              <TextField
                fullWidth
                label="House Number"
                name="houseNumber"
                required
              />
            </Box>
            <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
              <TextField
                fullWidth
                label="Postal Code"
                name="postalCode"
                required
              />
            </Box>
            <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
              <TextField fullWidth label="City" name="city" required />
            </Box>
            <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
              <TextField fullWidth label="Mobile Number" name="mobileNumber" />
            </Box>
            <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
              <TextField fullWidth label="Email" name="email" type="email" />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCustomerDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              // TODO: Implement customer creation
              await fetchCustomers();
              setOpenCustomerDialog(false);
            }}
          >
            Create Customer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders;
