import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  MenuItem,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import api from "../utils/axios";
import { Item, UnitOfMeasure } from "../types/item";
import { useDebounce } from "../hooks/useDebounce";

const Items: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<
    Omit<Item, "_id" | "createdAt" | "updatedAt">
  >({
    filterType: "",
    length: 0,
    width: 0,
    depth: 0,
    unitOfMeasure: UnitOfMeasure.MM,
    isActive: true,
  });

  const fetchItems = useCallback(async () => {
    try {
      const response = await api.get<Item[]>("/items");
      setItems(response.data);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleOpenDialog = useCallback((item?: Item) => {
    if (item) {
      setSelectedItem(item);
      setFormData({
        filterType: item.filterType,
        length: item.length,
        width: item.width,
        depth: item.depth,
        unitOfMeasure: item.unitOfMeasure,
        isActive: item.isActive,
      });
    } else {
      setSelectedItem(null);
      setFormData({
        filterType: "",
        length: 0,
        width: 0,
        depth: 0,
        unitOfMeasure: UnitOfMeasure.MM,
        isActive: true,
      });
    }
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setSelectedItem(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      if (selectedItem) {
        await api.patch(`/items/${selectedItem._id}`, formData);
      } else {
        await api.post("/items", formData);
      }
      fetchItems();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving item:", error);
    }
  }, [selectedItem, formData, fetchItems, handleCloseDialog]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (window.confirm("Are you sure you want to delete this item?")) {
        try {
          await api.delete(`/items/${id}`);
          fetchItems();
        } catch (error) {
          console.error("Error deleting item:", error);
        }
      }
    },
    [fetchItems]
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
      { field: "filterType", headerName: "Filter Type", flex: 1 },
      {
        field: "length",
        headerName: "Dimensions",
        flex: 1,
        renderCell: (params: GridRenderCellParams<Item>) => {
          if (!params?.row) return null;
          const { length, width, depth, unitOfMeasure } = params.row;
          return (
            <Box>
              <Typography>
                {length} × {width} × {depth} {unitOfMeasure}
              </Typography>
            </Box>
          );
        },
      },
      {
        field: "isActive",
        headerName: "Status",
        width: 120,
        renderCell: (params: GridRenderCellParams<Item>) => {
          if (!params?.row) return null;
          return (
            <Box>
              {params.value ? (
                <Typography color="success.main">Active</Typography>
              ) : (
                <Typography color="error.main">Inactive</Typography>
              )}
            </Box>
          );
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 120,
        renderCell: (params: GridRenderCellParams<Item>) => {
          if (!params?.row) return null;
          return (
            <Box>
              <IconButton
                size="small"
                onClick={() => handleOpenDialog(params.row)}
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
          );
        },
      },
    ],
    [handleOpenDialog, handleDelete]
  );

  const filteredItems = useMemo(
    () =>
      items.filter((item) =>
        Object.values(item).some((value) =>
          value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
      ),
    [items, searchQuery]
  );

  return (
    <Box sx={{ height: "100%", width: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5" component="h1">
          Items
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Item
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search items..."
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
          rows={filteredItems}
          columns={columns}
          getRowId={(row) => row._id}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          checkboxSelection
          disableRowSelectionOnClick
          loading={loading}
        />
      </Paper>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{selectedItem ? "Edit Item" : "Add New Item"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "grid", gap: 2, pt: 2 }}>
            <TextField
              label="Filter Type"
              value={formData.filterType}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, filterType: e.target.value }))
              }
              fullWidth
            />
            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
            >
              <TextField
                label="Length"
                type="number"
                value={formData.length}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    length: Number(e.target.value),
                  }))
                }
              />
              <TextField
                label="Width"
                type="number"
                value={formData.width}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    width: Number(e.target.value),
                  }))
                }
              />
              <TextField
                label="Depth"
                type="number"
                value={formData.depth}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    depth: Number(e.target.value),
                  }))
                }
              />
              <TextField
                select
                label="Unit of Measure"
                value={formData.unitOfMeasure}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    unitOfMeasure: e.target.value as UnitOfMeasure,
                  }))
                }
              >
                {Object.values(UnitOfMeasure).map((unit) => (
                  <MenuItem key={unit} value={unit}>
                    {unit}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedItem ? "Save Changes" : "Add Item"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Items;
