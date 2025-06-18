import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";

export enum DriverStatus {
  ACTIVE = "active",
  ON_VACATION = "on_vacation",
  INACTIVE = "inactive",
}

export interface DriverFormData {
  driverNumber: string;
  name: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  mobileNumber: string;
  email: string;
  password: string;
  status: DriverStatus;
  vacationStartDate?: string;
  vacationEndDate?: string;
}

interface DriverFormDialogProps {
  open: boolean;
  formData: DriverFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStatusChange: (e: SelectChangeEvent) => void;
  onClose: () => void;
  onSubmit: () => void;
  selectedDriver: any;
  loading?: boolean;
}

const DriverFormDialog: React.FC<DriverFormDialogProps> = React.memo(
  ({
    open,
    formData,
    onChange,
    onStatusChange,
    onClose,
    onSubmit,
    selectedDriver,
    loading,
  }) => {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedDriver ? "Edit Driver" : "Add Driver"}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 2,
              mt: 2,
            }}
          >
            <TextField
              name="driverNumber"
              label="Driver Number"
              value={formData.driverNumber}
              onChange={onChange}
              disabled={!!selectedDriver}
              required
              fullWidth
            />
            <TextField
              name="name"
              label="Name"
              value={formData.name}
              onChange={onChange}
              required
              fullWidth
            />
            <TextField
              name="street"
              label="Street"
              value={formData.street}
              onChange={onChange}
              required
              fullWidth
            />
            <TextField
              name="houseNumber"
              label="House Number"
              value={formData.houseNumber}
              onChange={onChange}
              required
              fullWidth
            />
            <TextField
              name="postalCode"
              label="Postal Code"
              value={formData.postalCode}
              onChange={onChange}
              required
              fullWidth
            />
            <TextField
              name="city"
              label="City"
              value={formData.city}
              onChange={onChange}
              required
              fullWidth
            />
            <TextField
              name="mobileNumber"
              label="Mobile Number"
              value={formData.mobileNumber}
              onChange={onChange}
              fullWidth
            />
            <TextField
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={onChange}
              fullWidth
            />
            {!selectedDriver && (
              <TextField
                name="password"
                label="Password"
                type="password"
                value={formData.password}
                onChange={onChange}
                required
                fullWidth
              />
            )}
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={onStatusChange}
                label="Status"
              >
                <MenuItem value={DriverStatus.ACTIVE}>Active</MenuItem>
                <MenuItem value={DriverStatus.ON_VACATION}>
                  On Vacation
                </MenuItem>
                <MenuItem value={DriverStatus.INACTIVE}>Inactive</MenuItem>
              </Select>
            </FormControl>
            {formData.status === DriverStatus.ON_VACATION && (
              <>
                <TextField
                  name="vacationStartDate"
                  label="Vacation Start Date"
                  type="date"
                  value={formData.vacationStartDate}
                  onChange={onChange}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  name="vacationEndDate"
                  label="Vacation End Date"
                  type="date"
                  value={formData.vacationEndDate}
                  onChange={onChange}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={onSubmit} variant="contained" disabled={loading}>
            {selectedDriver ? "Save Changes" : "Add Driver"}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);

export default DriverFormDialog;
