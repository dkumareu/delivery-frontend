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
import { useDebounce } from "../hooks/useDebounce";
import { useErrorHandler } from "../hooks/useErrorHandler";
import ErrorAlert from "../components/ErrorAlert";
import GoogleMapPicker from "../components/GoogleMapPicker";

enum DriverStatus {
  ACTIVE = "active",
  ON_VACATION = "on_vacation",
  INACTIVE = "inactive",
}

interface Driver {
  _id: string;
  driverNumber: string;
  name: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  mobileNumber: string;
  email: string;
  status: DriverStatus;
  vacationStartDate?: string;
  vacationEndDate?: string;
  latitude?: number;
  longitude?: number;
}

const Drivers: React.FC = () => {
  const navigate = useNavigate();
  const { error, handleError, clearError } = useErrorHandler();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState({
    driverNumber: "",
    name: "",
    street: "",
    houseNumber: "",
    postalCode: "",
    city: "",
    mobileNumber: "",
    email: "",
    password: "",
    status: DriverStatus.ACTIVE,
    vacationStartDate: "",
    vacationEndDate: "",
    latitude: 0,
    longitude: 0,
  });

  const fetchDrivers = useCallback(async () => {
    try {
      const response = await api.get<Driver[]>("/drivers");
      setDrivers(response.data);
    } catch (error) {
      handleError(error, "Failed to fetch drivers");
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleOpenDialog = useCallback((driver?: Driver) => {
    if (driver) {
      setSelectedDriver(driver);
      setFormData({
        driverNumber: driver.driverNumber,
        name: driver.name,
        street: driver.street,
        houseNumber: driver.houseNumber,
        postalCode: driver.postalCode,
        city: driver.city,
        mobileNumber: driver.mobileNumber || "",
        email: driver.email || "",
        password: "",
        status: driver.status,
        vacationStartDate: driver.vacationStartDate || "",
        vacationEndDate: driver.vacationEndDate || "",
        latitude: driver.latitude || 0,
        longitude: driver.longitude || 0,
      });
    } else {
      setSelectedDriver(null);
      setFormData({
        driverNumber: "",
        name: "",
        street: "",
        houseNumber: "",
        postalCode: "",
        city: "",
        mobileNumber: "",
        email: "",
        password: "",
        status: DriverStatus.ACTIVE,
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
    setSelectedDriver(null);
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
      status: e.target.value as DriverStatus,
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      if (selectedDriver) {
        await api.patch(`/drivers/${selectedDriver._id}`, formData);
      } else {
        await api.post("/drivers", formData);
      }
      fetchDrivers();
      handleCloseDialog();
    } catch (error) {
      handleError(error, "Failed to save driver");
    }
  }, [selectedDriver, formData, fetchDrivers, handleCloseDialog, handleError]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (window.confirm("Are you sure you want to delete this driver?")) {
        try {
          await api.delete(`/drivers/${id}`);
          fetchDrivers();
        } catch (error) {
          handleError(error, "Failed to delete driver");
        }
      }
    },
    [fetchDrivers, handleError]
  );

  const handleViewDetails = useCallback(
    (id: string) => {
      navigate(`/drivers/${id}`);
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
      { field: "driverNumber", headerName: "Driver Number", flex: 1 },
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
            {params.value === DriverStatus.ACTIVE && (
              <Typography color="success.main">Active</Typography>
            )}
            {params.value === DriverStatus.ON_VACATION && (
              <Typography color="warning.main">On Vacation</Typography>
            )}
            {params.value === DriverStatus.INACTIVE && (
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
              onClick={() => handleOpenDialog(params.row as Driver)}
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
    [handleViewDetails, handleOpenDialog, handleDelete]
  );

  const filteredDrivers = useMemo(
    () =>
      drivers.filter((driver) =>
        Object.values(driver).some((value) =>
          value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
      ),
    [drivers, searchQuery]
  );

  return (
    <Box sx={{ height: "100%", width: "100%" }}>
      <ErrorAlert error={error} onClose={clearError} />

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5" component="h1">
          Drivers
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Driver
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search drivers..."
          value={searchQuery}
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
          rows={filteredDrivers}
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
          {selectedDriver ? "Edit Driver" : "Add Driver"}
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
                name="driverNumber"
                label="Driver Number"
                value={formData.driverNumber}
                onChange={handleInputChange}
                disabled={!!selectedDriver}
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

          {/* Password - only for new drivers */}
          {!selectedDriver && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Authentication
              </Typography>
              <Box
                sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
              >
                <TextField
                  name="password"
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  fullWidth
                />
              </Box>
            </Box>
          )}

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
                  <MenuItem value={DriverStatus.ACTIVE}>Active</MenuItem>
                  <MenuItem value={DriverStatus.ON_VACATION}>
                    On Vacation
                  </MenuItem>
                  <MenuItem value={DriverStatus.INACTIVE}>Inactive</MenuItem>
                </Select>
              </FormControl>

              {/* Vacation dates - only show when status is ON_VACATION */}
              {formData.status === DriverStatus.ON_VACATION && (
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
              Depot Point
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
              Location on Map (Depot Point)
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
            {selectedDriver ? "Save Changes" : "Add Driver"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Drivers;
