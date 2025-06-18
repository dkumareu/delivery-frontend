import React, { useState, useCallback } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Autocomplete,
  Typography,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { Customer } from "../types/customer";
import { Item } from "../types/item";
import {
  Order,
  OrderItem,
  PaymentMethod,
  Frequency,
  VatRate,
} from "../types/order";

interface OrderDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (orderData: any) => Promise<void>;
  selectedOrder: Order | null;
  customers: Customer[];
  items: Item[];
  onAddCustomer: () => void;
}

const OrderDialog: React.FC<OrderDialogProps> = ({
  open,
  onClose,
  onSubmit,
  selectedOrder,
  customers,
  items,
  onAddCustomer,
}) => {
  const [formData, setFormData] = useState({
    customer: "",
    items: [] as OrderItem[],
    paymentMethod: PaymentMethod.CASH,
    driverNote: "",
    startDate: "",
    endDate: "",
    frequency: Frequency.WEEKLY,
  });

  // Initialize form data when selectedOrder changes
  React.useEffect(() => {
    if (selectedOrder) {
      setFormData({
        customer: selectedOrder.customer._id,
        items: selectedOrder.items,
        paymentMethod: selectedOrder.paymentMethod,
        driverNote: selectedOrder.driverNote || "",
        startDate: selectedOrder.startDate
          ? new Date(selectedOrder.startDate).toISOString().split("T")[0]
          : "",
        endDate: selectedOrder.endDate
          ? new Date(selectedOrder.endDate).toISOString().split("T")[0]
          : "",
        frequency: selectedOrder.frequency || Frequency.WEEKLY,
      });
    } else {
      setFormData({
        customer: "",
        items: [],
        paymentMethod: PaymentMethod.CASH,
        driverNote: "",
        startDate: "",
        endDate: "",
        frequency: Frequency.WEEKLY,
      });
    }
  }, [selectedOrder]);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    []
  );

  const handleSelectChange = useCallback((event: SelectChangeEvent) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleAddItem = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          item: items[0],
          quantity: 1,
          unitPrice: 0,
          vatRate: VatRate.STANDARD,
          netAmount: 0,
          grossAmount: 0,
        },
      ],
    }));
  }, [items]);

  const handleItemChange = useCallback(
    (index: number, field: keyof OrderItem, value: any) => {
      setFormData((prev) => {
        const newItems = [...prev.items];
        const item = newItems[index];

        if (field === "item") {
          item.item = value;
        } else {
          (item as any)[field] = value;
        }

        // Recalculate amounts
        item.netAmount = item.quantity * item.unitPrice;
        item.grossAmount = item.netAmount * (1 + item.vatRate / 100);

        return {
          ...prev,
          items: newItems,
        };
      });
    },
    []
  );

  const handleSubmit = async () => {
    try {
      const orderData = {
        ...formData,
        totalNetAmount: formData.items.reduce(
          (sum, item) => sum + item.netAmount,
          0
        ),
        totalGrossAmount: formData.items.reduce(
          (sum, item) => sum + item.grossAmount,
          0
        ),
      };

      await onSubmit(orderData);
      onClose();
    } catch (error) {
      console.error("Error saving order:", error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {selectedOrder ? "Edit Order" : "Add New Order"}
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 2,
            pt: 2,
          }}
        >
          <Box sx={{ gridColumn: "1 / -1" }}>
            <Autocomplete
              options={customers}
              getOptionLabel={(option) =>
                `${option.customerNumber} - ${option.name} (${option.street} ${option.houseNumber}, ${option.postalCode} ${option.city})`
              }
              value={customers.find((c) => c._id === formData.customer) || null}
              onChange={(_, newValue) => {
                if (newValue) {
                  setFormData((prev) => ({
                    ...prev,
                    customer: newValue._id,
                  }));
                }
              }}
              renderInput={(params) => (
                <TextField {...params} label="Customer" required />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body1">
                      {option.customerNumber} - {option.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.street} {option.houseNumber}, {option.postalCode}{" "}
                      {option.city}
                    </Typography>
                  </Box>
                </li>
              )}
              noOptionsText={
                <Button
                  startIcon={<AddIcon />}
                  onClick={onAddCustomer}
                  fullWidth
                >
                  Add New Customer
                </Button>
              }
            />
          </Box>

          <Box sx={{ gridColumn: "1 / -1" }}>
            <Typography variant="h6" gutterBottom>
              Order Items
            </Typography>
            {formData.items.map((item, index) => (
              <Box
                key={index}
                sx={{
                  mb: 2,
                  p: 2,
                  border: "1px solid #ddd",
                  borderRadius: 1,
                }}
              >
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
                    <Autocomplete
                      options={items}
                      getOptionLabel={(option) =>
                        `${option.filterType} (${option.length}×${option.width}×${option.depth} ${option.unitOfMeasure})`
                      }
                      value={item.item}
                      onChange={(_, newValue) => {
                        if (newValue) {
                          handleItemChange(index, "item", newValue);
                        }
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label="Item" required />
                      )}
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Quantity"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "quantity",
                          Number(e.target.value)
                        )
                      }
                      required
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Unit Price"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "unitPrice",
                          Number(e.target.value)
                        )
                      }
                      required
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
                    <FormControl fullWidth>
                      <InputLabel>VAT Rate</InputLabel>
                      <Select
                        value={item.vatRate}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "vatRate",
                            Number(e.target.value)
                          )
                        }
                        label="VAT Rate"
                      >
                        {Object.values(VatRate).map((rate) => (
                          <MenuItem key={rate} value={rate}>
                            {rate}%
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
                    <Typography>
                      Net Amount: €{item.netAmount.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
                    <Typography>
                      Gross Amount: €{item.grossAmount.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
            <Button
              variant="outlined"
              onClick={handleAddItem}
              startIcon={<AddIcon />}
              sx={{ mt: 2 }}
            >
              Add Item
            </Button>
          </Box>

          <FormControl fullWidth>
            <InputLabel>Payment Method</InputLabel>
            <Select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleSelectChange}
              label="Payment Method"
            >
              {Object.values(PaymentMethod).map((method) => (
                <MenuItem key={method} value={method}>
                  {method.replace("_", " ").toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            name="driverNote"
            label="Note for Driver"
            value={formData.driverNote}
            onChange={handleInputChange}
            fullWidth
            multiline
            rows={3}
            sx={{ gridColumn: "1 / -1" }}
          />

          <TextField
            name="startDate"
            label="Start Date"
            type="date"
            value={formData.startDate}
            onChange={handleInputChange}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            name="endDate"
            label="End Date"
            type="date"
            value={formData.endDate}
            onChange={handleInputChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <FormControl fullWidth>
            <InputLabel>Frequency</InputLabel>
            <Select
              name="frequency"
              value={formData.frequency}
              onChange={handleSelectChange}
              label="Frequency"
            >
              {Object.values(Frequency).map((freq) => (
                <MenuItem key={freq} value={freq}>
                  {freq.replace("_", " ").toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          {selectedOrder ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderDialog;
