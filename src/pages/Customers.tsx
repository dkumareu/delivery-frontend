import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import api from "../utils/axios";
import { Customer, CustomerStatus } from "../types/customer";
import { useDebounce } from "../hooks/useDebounce";
import { useErrorHandler } from "../hooks/useErrorHandler";
import ErrorAlert from "../components/ErrorAlert";
import GoogleMapPicker from "../components/GoogleMapPicker";

const Customers: React.FC = () => {
  const navigate = useNavigate();
  const { error, handleError, clearError } = useErrorHandler();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [formData, setFormData] = useState({
    customerNumber: "",
    name: "",
    street: "",
    houseNumber: "",
    postalCode: "",
    city: "",
    mobileNumber: "",
    email: "",
    status: CustomerStatus.ACTIVE,
    vacationStartDate: "",
    vacationEndDate: "",
    latitude: 0,
    longitude: 0,
  });

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await api.get<Customer[]>("/customers");
      setCustomers(response.data);
    } catch (error) {
      handleError(error, "Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleOpenDialog = useCallback((customer?: Customer) => {
    if (customer) {
      setSelectedCustomer(customer);
      setFormData({
        customerNumber: customer.customerNumber,
        name: customer.name,
        street: customer.street,
        houseNumber: customer.houseNumber,
        postalCode: customer.postalCode,
        city: customer.city,
        mobileNumber: customer.mobileNumber || "",
        email: customer.email || "",
        status: customer.status,
        vacationStartDate: customer.vacationStartDate || "",
        vacationEndDate: customer.vacationEndDate || "",
        latitude: customer.latitude || 0,
        longitude: customer.longitude || 0,
      });
    } else {
      setSelectedCustomer(null);
      setFormData({
        customerNumber: "",
        name: "",
        street: "",
        houseNumber: "",
        postalCode: "",
        city: "",
        mobileNumber: "",
        email: "",
        status: CustomerStatus.ACTIVE,
        vacationStartDate: "",
        vacationEndDate: "",
        latitude: 0,
        longitude: 0,
      });
    }
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setSelectedCustomer(null);
    clearError(); // Clear any errors when closing dialog
  }, [clearError]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    []
  );

  const handleStatusChange = useCallback((e: SelectChangeEvent) => {
    setFormData((prev) => ({
      ...prev,
      status: e.target.value as CustomerStatus,
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      if (selectedCustomer) {
        await api.patch(`/customers/${selectedCustomer._id}`, formData);
      } else {
        await api.post("/customers", formData);
      }
      fetchCustomers();
      handleCloseDialog();
    } catch (error) {
      handleError(error, "Failed to save customer");
    }
  }, [
    selectedCustomer,
    formData,
    fetchCustomers,
    handleCloseDialog,
    handleError,
  ]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (window.confirm("Are you sure you want to delete this customer?")) {
        try {
          await api.delete(`/customers/${id}`);
          fetchCustomers();
        } catch (error) {
          handleError(error, "Failed to delete customer");
        }
      }
    },
    [fetchCustomers, handleError]
  );

  const handleViewDetails = useCallback(
    (id: string) => {
      navigate(`/customers/${id}`);
    },
    [navigate]
  );

  const debouncedSetSearchQuery = useDebounce((value: string) => {
    setSearchQuery(value);
  }, 300);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      debouncedSetSearchQuery(e.target.value);
    },
    [debouncedSetSearchQuery]
  );

  const columns: GridColDef[] = useMemo(
    () => [
      { field: "customerNumber", headerName: "Customer Number", flex: 1 },
      { field: "name", headerName: "Name", flex: 1 },
      { field: "city", headerName: "City", flex: 1 },
      { field: "postalCode", headerName: "Postal Code", width: 120 },
      { field: "mobileNumber", headerName: "Mobile", flex: 1 },
      { field: "email", headerName: "Email", flex: 1 },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        renderCell: (params: GridRenderCellParams) => (
          <Box>
            {params.value === CustomerStatus.ACTIVE && (
              <Typography color="success.main">Active</Typography>
            )}
            {params.value === CustomerStatus.ON_VACATION && (
              <Typography color="warning.main">On Vacation</Typography>
            )}
            {params.value === CustomerStatus.INACTIVE && (
              <Typography color="error.main">Inactive</Typography>
            )}
          </Box>
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 150,
        renderCell: (params: GridRenderCellParams) => (
          <Box>
            <IconButton
              size="small"
              onClick={() => handleViewDetails(params.row._id)}
              color="primary"
            >
              <ViewIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleOpenDialog(params.row as Customer)}
              color="primary"
            >
              <EditIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleDelete(params.row._id)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ),
      },
    ],
    [handleOpenDialog, handleDelete, handleViewDetails]
  );

  const filteredCustomers = useMemo(
    () =>
      customers.filter((customer) =>
        Object.values(customer).some((value) =>
          value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
      ),
    [customers, searchQuery]
  );

  return (
    <Box sx={{ height: "100%", width: "100%" }}>
      <ErrorAlert error={error} onClose={clearError} />

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5" component="h1">
          Customers
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Customer
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search customers..."
          onChange={handleSearchChange}
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
        <DataGrid
          rows={filteredCustomers}
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
        />
      </Paper>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedCustomer ? "Edit Customer" : "Add Customer"}
        </DialogTitle>
        <DialogContent>
          {/* Basic Information */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Basic Information
            </Typography>
            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
            >
              <TextField
                name="customerNumber"
                label="Customer Number"
                value={formData.customerNumber}
                onChange={handleInputChange}
                disabled={!!selectedCustomer}
                required
                fullWidth
              />
              <TextField
                name="name"
                label="Name"
                value={formData.name}
                onChange={handleInputChange}
                required
                fullWidth
              />
            </Box>
          </Box>

          {/* Contact Information */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Contact Information
            </Typography>
            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
            >
              <TextField
                name="mobileNumber"
                label="Mobile Number"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                fullWidth
              />
            </Box>
          </Box>

          {/* Status and Vacation Dates */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Status
            </Typography>
            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
            >
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleStatusChange}
                  label="Status"
                >
                  <MenuItem value={CustomerStatus.ACTIVE}>Active</MenuItem>
                  <MenuItem value={CustomerStatus.ON_VACATION}>
                    On Vacation
                  </MenuItem>
                  <MenuItem value={CustomerStatus.INACTIVE}>Inactive</MenuItem>
                </Select>
              </FormControl>

              {/* Vacation dates - only show when status is ON_VACATION */}
              {formData.status === CustomerStatus.ON_VACATION && (
                <>
                  <TextField
                    name="vacationStartDate"
                    label="Vacation Start Date"
                    type="date"
                    value={formData.vacationStartDate}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <TextField
                    name="vacationEndDate"
                    label="Vacation End Date"
                    type="date"
                    value={formData.vacationEndDate}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </>
              )}
            </Box>
          </Box>

          {/* Address Information - Grouped together */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Address Information
            </Typography>
            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
            >
              <TextField
                name="street"
                label="Street"
                value={formData.street}
                onChange={handleInputChange}
                required
                fullWidth
              />
              <TextField
                name="houseNumber"
                label="House Number"
                value={formData.houseNumber}
                onChange={handleInputChange}
                required
                fullWidth
              />
              <TextField
                name="postalCode"
                label="Postal Code"
                value={formData.postalCode}
                onChange={handleInputChange}
                required
                fullWidth
              />
              <TextField
                name="city"
                label="City"
                value={formData.city}
                onChange={handleInputChange}
                required
                fullWidth
              />
            </Box>
          </Box>

          {/* Location Map */}
          <Box sx={{ mt: 3 }}>
            <Typography
              variant="h6"
              sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
            >
              <LocationIcon />
              Location on Map
            </Typography>
            <GoogleMapPicker
              latitude={formData.latitude}
              longitude={formData.longitude}
              onLocationChange={(lat, lng) => {
                setFormData((prev) => ({
                  ...prev,
                  latitude: lat,
                  longitude: lng,
                }));
              }}
              address={[
                formData.street,
                formData.houseNumber,
                formData.postalCode,
                formData.city,
              ]
                .filter(Boolean)
                .join(", ")}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedCustomer ? "Save Changes" : "Add Customer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customers;
