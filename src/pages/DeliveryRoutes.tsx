import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Card,
  CardContent,
  Chip,
  CircularProgress,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
} from "@mui/icons-material";
import api from "../utils/axios";

interface Driver {
  _id: string;
  driverNumber: string;
  name: string;
  status: string;
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
}

const DeliveryRoutes: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [draggableOrder, setDraggableOrder] = useState<Order[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Base location (Berlin)
  const baseLocation = { lat: 52.52, lng: 13.405 };

  // Fetch drivers
  const fetchDrivers = useCallback(async () => {
    try {
      const response = await api.get<Driver[]>("/drivers");
      setDrivers(response.data);
    } catch (error) {
      // Error will be automatically shown by axios interceptor
    }
  }, []);

  // Fetch orders for selected driver and date
  const fetchOrders = useCallback(async () => {
    if (!selectedDriver || !selectedDate) return;

    try {
      setLoading(true);
      const dateStr = `${selectedDate.getFullYear()}-${String(
        selectedDate.getMonth() + 1
      ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
      const response = await api.get<Order[]>(
        `/orders?driver=${selectedDriver._id}&date=${dateStr}&allOrders=true`
      );
      setOrders(response.data);
      // New: Set draggable order to orders with coordinates, sorted by delivery sequence
      const ordersWithCoords = response.data.filter(
        (order) => order.customer.latitude && order.customer.longitude
      );

      // Sort by delivery sequence if available, otherwise by order number
      const sortedOrders = ordersWithCoords.sort((a, b) => {
        if (a.deliverySequence && b.deliverySequence) {
          return a.deliverySequence - b.deliverySequence;
        }
        return a.orderNumber.localeCompare(b.orderNumber);
      });

      setDraggableOrder(sortedOrders);
    } catch (error) {
      // Error will be automatically shown by axios interceptor
    } finally {
      setLoading(false);
    }
  }, [selectedDriver, selectedDate]);

  // Update draggableOrder if orders change (e.g., after fetch)
  useEffect(() => {
    setDraggableOrder(
      orders.filter(
        (order) => order.customer.latitude && order.customer.longitude
      )
    );
  }, [orders]);

  // Drag-and-drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    event.preventDefault();
    // Optionally, add visual feedback
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const newOrder = [...draggableOrder];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, removed);
    setDraggableOrder(newOrder);
    setDraggedIndex(null);

    // Save the new sequence to the backend
    saveDeliverySequence(newOrder);
  };

  const saveDeliverySequence = async (newOrder: Order[]) => {
    if (!selectedDriver || !selectedDate) return;

    try {
      const orderIds = newOrder.map((order) => order._id);
      const dateStr = `${selectedDate.getFullYear()}-${String(
        selectedDate.getMonth() + 1
      ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

      await api.post("/orders/update-sequence", {
        orderIds,
        driverId: selectedDriver._id,
        deliveryDate: dateStr,
      });

      console.log("Delivery sequence saved successfully");
    } catch (error) {
      console.error("Error saving delivery sequence:", error);
      // Error will be automatically shown by axios interceptor
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Initialize map
  const initializeMap = useCallback(() => {
    if (!window.google || !window.google.maps) return;

    const mapElement = document.getElementById("delivery-map");
    if (!mapElement) return;

    const map = new window.google.maps.Map(mapElement, {
      center: baseLocation,
      zoom: 10,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
    });

    // Add base location marker
    new window.google.maps.Marker({
      position: baseLocation,
      map: map,
      title: "Base Location (Berlin)",
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 15,
        fillColor: "#4285F4",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 3,
      },
    });

    // Use draggableOrder for route and markers
    const ordersWithCoords = draggableOrder;

    const markers: google.maps.Marker[] = [];
    const polylines: google.maps.Polyline[] = [];

    // Route colors for different segments
    const routeColors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E9",
    ];

    ordersWithCoords.forEach((order, index) => {
      const customer = order.customer;
      const marker = new window.google.maps.Marker({
        position: { lat: customer.latitude, lng: customer.longitude },
        map: map,
        title: customer.name,
        label: {
          text: (index + 1).toString(),
          color: "white",
          fontWeight: "bold",
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: "#FF6B6B",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 2,
        },
      });

      marker.addListener("click", () => {
        setSelectedCustomer(customer);
      });

      markers.push(marker);
    });

    // Draw simple route lines connecting the points
    if (ordersWithCoords.length > 0) {
      const points = [
        baseLocation,
        ...ordersWithCoords.map((order) => ({
          lat: order.customer.latitude,
          lng: order.customer.longitude,
        })),
        baseLocation,
      ];

      // Draw route segments
      for (let i = 0; i < points.length - 1; i++) {
        const polyline = new window.google.maps.Polyline({
          path: [points[i], points[i + 1]],
          geodesic: true,
          strokeColor: routeColors[i % routeColors.length],
          strokeOpacity: 1.0,
          strokeWeight: 4,
          map: map,
        });
        polylines.push(polyline);
      }

      // Add info windows for route segments
      polylines.forEach((polyline, index) => {
        const startPoint = points[index];
        const endPoint = points[index + 1];
        const midPoint = {
          lat: (startPoint.lat + endPoint.lat) / 2,
          lng: (startPoint.lng + endPoint.lng) / 2,
        };

        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div style="padding: 8px;">
            <strong>Route Segment ${index + 1}</strong><br>
            ${
              index === 0
                ? "Base → Customer 1"
                : index === points.length - 2
                ? "Last Customer → Base"
                : `Customer ${index} → Customer ${index + 1}`
            }
          </div>`,
        });

        polyline.addListener("click", () => {
          infoWindow.setPosition(midPoint);
          infoWindow.open(map);
        });
      });
    }
  }, [draggableOrder]);

  // Initialize map when draggableOrder changes
  useEffect(() => {
    if (window.google && window.google.maps) {
      initializeMap();
    }
  }, [initializeMap]);

  // Fetch drivers on component mount
  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  // Fetch orders when driver or date changes
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const routePoints = orders.filter(
    (order) => order.customer.latitude && order.customer.longitude
  );

  const allOrders = orders; // Show all orders, not just those with coordinates

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{ p: 3, height: "100vh", display: "flex", flexDirection: "column" }}
      >
        <Typography variant="h4" gutterBottom>
          Delivery Routes Planning
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
              <DatePicker
                label="Select Date"
                value={selectedDate}
                onChange={(newDate) => setSelectedDate(newDate)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" color="text.secondary">
                {selectedDriver && selectedDate && (
                  <>
                    <strong>Driver:</strong> {selectedDriver.name} |
                    <strong> Date:</strong> {formatDate(selectedDate)} |
                    <strong> Orders:</strong> {orders.length}
                  </>
                )}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Main Content */}
        <Box sx={{ display: "flex", flex: 1, gap: 2, minHeight: 0 }}>
          {/* Left Panel - Customer Details */}
          <Box sx={{ width: "40%", display: "flex", flexDirection: "column" }}>
            <Paper sx={{ flex: 1, overflow: "auto" }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
                <Typography variant="h6">
                  Delivery Route ({allOrders.length} orders,{" "}
                  {routePoints.length} with coordinates)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Starting from Berlin base location
                </Typography>
              </Box>

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : allOrders.length === 0 ? (
                <Box sx={{ p: 4, textAlign: "center" }}>
                  <Typography color="text.secondary">
                    No orders found for selected driver and date
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ p: 1 }}>
                  {draggableOrder.map((order, index) => {
                    const hasCoordinates =
                      order.customer.latitude && order.customer.longitude;
                    return (
                      <Card
                        key={order._id}
                        sx={{
                          mb: 1,
                          cursor: "pointer",
                          border:
                            selectedCustomer?._id === order.customer._id
                              ? 2
                              : 1,
                          borderColor:
                            selectedCustomer?._id === order.customer._id
                              ? "primary.main"
                              : "divider",
                          opacity: hasCoordinates ? 1 : 0.7,
                          "&:hover": { bgcolor: "action.hover" },
                          boxShadow: draggedIndex === index ? 6 : undefined,
                          background:
                            draggedIndex === index ? "#e3f2fd" : undefined,
                        }}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={() => handleDrop(index)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setSelectedCustomer(order.customer)}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mb: 1,
                            }}
                          >
                            <Chip
                              label={hasCoordinates ? index + 1 : "?"}
                              size="small"
                              color={hasCoordinates ? "primary" : "default"}
                              sx={{ mr: 1 }}
                            />
                            <Typography variant="h6" sx={{ flex: 1 }}>
                              {order.customer.name}
                            </Typography>
                            {!hasCoordinates && (
                              <Chip
                                label="No Location"
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                            )}
                          </Box>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                          >
                            Order #{order.orderNumber}
                          </Typography>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mb: 0.5,
                            }}
                          >
                            <HomeIcon
                              sx={{
                                fontSize: 16,
                                mr: 1,
                                color: "text.secondary",
                              }}
                            />
                            <Typography variant="body2">
                              {order.customer.street}{" "}
                              {order.customer.houseNumber},{" "}
                              {order.customer.postalCode} {order.customer.city}
                            </Typography>
                          </Box>

                          {order.customer.mobileNumber && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 0.5,
                              }}
                            >
                              <PhoneIcon
                                sx={{
                                  fontSize: 16,
                                  mr: 1,
                                  color: "text.secondary",
                                }}
                              />
                              <Typography variant="body2">
                                {order.customer.mobileNumber}
                              </Typography>
                            </Box>
                          )}

                          {order.customer.email && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 0.5,
                              }}
                            >
                              <EmailIcon
                                sx={{
                                  fontSize: 16,
                                  mr: 1,
                                  color: "text.secondary",
                                }}
                              />
                              <Typography variant="body2">
                                {order.customer.email}
                              </Typography>
                            </Box>
                          )}

                          {order.frequency && (
                            <Box sx={{ mt: 1 }}>
                              <Chip
                                label={order.frequency}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          )}

                          {!hasCoordinates && (
                            <Box sx={{ mt: 1 }}>
                              <Typography
                                variant="caption"
                                color="warning.main"
                              >
                                ⚠️ Location coordinates not available for route
                                planning
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              )}
            </Paper>
          </Box>

          {/* Right Panel - Map */}
          <Box sx={{ width: "60%" }}>
            <Paper sx={{ height: "100%", overflow: "hidden" }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
                <Typography variant="h6">Route Map</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedCustomer
                    ? `Selected: ${selectedCustomer.name}`
                    : routePoints.length === 0
                    ? "No customer locations available for route planning"
                    : "Click on markers or customers to view details"}
                </Typography>
                {routePoints.length === 0 && allOrders.length > 0 && (
                  <Typography
                    variant="caption"
                    color="warning.main"
                    sx={{ display: "block", mt: 1 }}
                  >
                    ⚠️ Customers need latitude/longitude coordinates to appear
                    on the map
                  </Typography>
                )}
              </Box>
              <Box
                id="delivery-map"
                sx={{
                  height: "calc(100% - 80px)",
                  width: "100%",
                }}
              />
            </Paper>
          </Box>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default DeliveryRoutes;
