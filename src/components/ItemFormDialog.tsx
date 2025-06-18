import React, { useCallback, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  SelectChangeEvent,
} from "@mui/material";
import { UnitOfMeasure } from "../types/item";

interface ItemFormData {
  filterType: string;
  length: number;
  width: number;
  depth: number;
  unitOfMeasure: UnitOfMeasure;
  isActive: boolean;
}

interface ItemFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ItemFormData) => void;
  initialData?: ItemFormData;
  title: string;
}

const ItemFormDialog: React.FC<ItemFormDialogProps> = React.memo(
  ({ open, onClose, onSubmit, initialData, title }) => {
    const [formData, setFormData] = React.useState<ItemFormData>(() => ({
      filterType: "",
      length: 0,
      width: 0,
      depth: 0,
      unitOfMeasure: UnitOfMeasure.MM,
      isActive: true,
      ...initialData,
    }));

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
          ...prev,
          [name]: name === "filterType" ? value : Number(value),
        }));
      },
      []
    );

    const handleUnitChange = useCallback(
      (e: SelectChangeEvent<UnitOfMeasure>) => {
        setFormData((prev) => ({
          ...prev,
          unitOfMeasure: e.target.value as UnitOfMeasure,
        }));
      },
      []
    );

    const handleSubmit = useCallback(() => {
      onSubmit(formData);
    }, [formData, onSubmit]);

    const formContent = useMemo(
      () => (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 2,
            pt: 2,
          }}
        >
          <TextField
            name="filterType"
            label="Filter Type"
            value={formData.filterType}
            onChange={handleInputChange}
            fullWidth
            required
            sx={{ gridColumn: "1 / -1" }}
          />
          <TextField
            name="length"
            label="Length"
            type="number"
            value={formData.length}
            onChange={handleInputChange}
            fullWidth
            required
            inputProps={{ min: 0, step: "any" }}
          />
          <TextField
            name="width"
            label="Width"
            type="number"
            value={formData.width}
            onChange={handleInputChange}
            fullWidth
            required
            inputProps={{ min: 0, step: "any" }}
          />
          <TextField
            name="depth"
            label="Depth"
            type="number"
            value={formData.depth}
            onChange={handleInputChange}
            fullWidth
            required
            inputProps={{ min: 0, step: "any" }}
          />
          <FormControl fullWidth sx={{ gridColumn: "1 / -1" }}>
            <InputLabel>Unit of Measure</InputLabel>
            <Select
              name="unitOfMeasure"
              value={formData.unitOfMeasure}
              onChange={handleUnitChange}
              label="Unit of Measure"
            >
              <MenuItem value={UnitOfMeasure.MM}>Millimeters (mm)</MenuItem>
              <MenuItem value={UnitOfMeasure.CM}>Centimeters (cm)</MenuItem>
              <MenuItem value={UnitOfMeasure.M}>Meters (m)</MenuItem>
            </Select>
          </FormControl>
        </Box>
      ),
      [formData, handleInputChange, handleUnitChange]
    );

    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>{formContent}</DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {initialData ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);

ItemFormDialog.displayName = "ItemFormDialog";

export default ItemFormDialog;
