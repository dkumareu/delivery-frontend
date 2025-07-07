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
  Button,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Download as DownloadIcon,
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

const DeliveryRoutes: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [draggableOrder, setDraggableOrder] = useState<Order[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [routeInfo, setRouteInfo] = useState<{
    totalDistance: number;
    totalDuration: number;
    legs: Array<{
      distance: string;
      duration: string;
      startAddress: string;
      endAddress: string;
    }>;
  } | null>(null);

  // Base location from selected driver
  const baseLocation = selectedDriver?.latitude && selectedDriver?.longitude 
    ? { lat: selectedDriver.latitude, lng: selectedDriver.longitude }
    : { lat: 52.52, lng: 13.405 }; // Fallback to Berlin if no driver location

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
      title: selectedDriver 
        ? `Driver Base: ${selectedDriver.name}`
        : "Base Location (Berlin)",
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
    const directionsRenderers: google.maps.DirectionsRenderer[] = [];

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

    // Create optimized road routes using Directions Service
    if (ordersWithCoords.length > 0) {
      setRouteLoading(true);
      const directionsService = new window.google.maps.DirectionsService();
      
      // Create waypoints for the route
      const waypoints = ordersWithCoords.map((order) => ({
        location: new window.google.maps.LatLng(
          order.customer.latitude,
          order.customer.longitude
        ),
        stopover: true,
      }));

      // Create directions request
      const request: google.maps.DirectionsRequest = {
        origin: baseLocation,
        destination: baseLocation, // Return to base
        waypoints: waypoints,
        optimizeWaypoints: false, // Keep our manual order
        travelMode: window.google.maps.TravelMode.DRIVING,
      };

             // Get optimized route
       directionsService.route(request, (result, status) => {
         setRouteLoading(false);
                  if (status === window.google.maps.DirectionsStatus.OK) {
           // Clear existing renderers
           directionsRenderers.forEach((renderer) => {
             renderer.setMap(null);
           });
           directionsRenderers.length = 0;

           // Create a custom directions renderer with custom styling
           const directionsRenderer = new window.google.maps.DirectionsRenderer({
             suppressMarkers: true, // We'll use our custom markers
             polylineOptions: {
               strokeColor: "#4285F4",
               strokeWeight: 6,
               strokeOpacity: 0.8,
             },
           });

                      // Instead of using the directions renderer, create individual polylines for each leg
           const route = result?.routes?.[0];
           if (route) {
             const totalDistance = route.legs.reduce(
               (total, leg) => total + (leg.distance?.value || 0),
               0
             );
             const totalDuration = route.legs.reduce(
               (total, leg) => total + (leg.duration?.value || 0),
               0
             );

             // Update route info state
             setRouteInfo({
               totalDistance,
               totalDuration,
               legs: route.legs.map((leg) => ({
                 distance: leg.distance?.text || '',
                 duration: leg.duration?.text || '',
                 startAddress: leg.start_address || '',
                 endAddress: leg.end_address || '',
               })),
             });

            // Add info window for route summary
            const routeInfoWindow = new window.google.maps.InfoWindow({
              content: `<div style="padding: 12px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; color: #4285F4;">Route Summary</h3>
                <p style="margin: 4px 0;"><strong>Driver:</strong> ${selectedDriver?.name || 'Unknown'}</p>
                <p style="margin: 4px 0;"><strong>Base Location:</strong> ${selectedDriver?.latitude && selectedDriver?.longitude ? `${selectedDriver.latitude.toFixed(4)}, ${selectedDriver.longitude.toFixed(4)}` : 'Berlin (Default)'}</p>
                <p style="margin: 4px 0;"><strong>Total Distance:</strong> ${(totalDistance / 1000).toFixed(1)} km</p>
                <p style="margin: 4px 0;"><strong>Total Duration:</strong> ${Math.round(totalDuration / 60)} minutes</p>
                <p style="margin: 4px 0;"><strong>Stops:</strong> ${ordersWithCoords.length}</p>
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">
                  Route optimized for driving directions
                </p>
              </div>`,
            });

            // Add click listener to base marker to show route info
            const baseMarker = new window.google.maps.Marker({
              position: baseLocation,
              map: map,
              title: selectedDriver 
                ? `Driver Base: ${selectedDriver.name} - Click for route info`
                : "Base Location (Berlin) - Click for route info",
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 15,
                fillColor: "#4285F4",
                fillOpacity: 1,
                strokeColor: "#FFFFFF",
                strokeWeight: 3,
              },
            });

            baseMarker.addListener("click", () => {
              routeInfoWindow.setPosition(baseLocation);
              routeInfoWindow.open(map);
            });

            // Create individual polylines for each leg with different colors
            route.legs.forEach((leg, index) => {
              const legColor = index === 0 ? "#4285F4" : routeColors[(index - 1) % routeColors.length];
              
              const legInfoWindow = new window.google.maps.InfoWindow({
                content: `<div style="padding: 8px; min-width: 150px;">
                  <div style="display: flex; align-items: center; margin-bottom: 4px;">
                    <div style="width: 12px; height: 12px; background-color: ${legColor}; border-radius: 50%; margin-right: 8px;"></div>
                    <strong>Leg ${index + 1}</strong>
                  </div>
                  <strong>From:</strong> ${leg.start_address}<br>
                  <strong>To:</strong> ${leg.end_address}<br>
                  <strong>Distance:</strong> ${leg.distance?.text}<br>
                  <strong>Duration:</strong> ${leg.duration?.text}
                  ${index === 0 ? '<br><strong>Type:</strong> Base route' : ''}
                </div>`,
              });

              // Create polyline for this specific leg
              if (leg.steps && leg.steps.length > 0) {
                const path: google.maps.LatLng[] = [];
                
                // Build path from leg steps
                leg.steps.forEach((step) => {
                  if (step.path) {
                    step.path.forEach((point) => {
                      path.push(new window.google.maps.LatLng(point.lat(), point.lng()));
                    });
                  }
                });

                if (path.length > 0) {
                  const polyline = new window.google.maps.Polyline({
                    path: path,
                    strokeColor: legColor,
                    strokeWeight: 6,
                    strokeOpacity: 0.8,
                    icons: [
                      {
                        icon: {
                          path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                          scale: 1.5,
                          fillColor: legColor,
                          fillOpacity: 0.8,
                          strokeColor: "#FFFFFF",
                          strokeWeight: 0.5,
                        },
                        offset: "50%",
                        repeat: "300px",
                      },
                    ],
                    map: map,
                  });

                  polyline.addListener("click", () => {
                    const midPoint = path[Math.floor(path.length / 2)];
                    legInfoWindow.setPosition(midPoint);
                    legInfoWindow.open(map);
                  });
                }
              }
            });
           }
                 } else {
           console.error("Directions request failed due to " + status);
           setRouteInfo(null);
           
           // Show user-friendly error message
           const errorInfoWindow = new window.google.maps.InfoWindow({
             content: `<div style="padding: 12px; min-width: 200px;">
               <h3 style="margin: 0 0 8px 0; color: #f44336;">⚠️ Route Calculation Failed</h3>
               <p style="margin: 4px 0;">Unable to calculate optimized route.</p>
               <p style="margin: 4px 0; font-size: 12px; color: #666;">
                 Showing straight-line route as fallback.
               </p>
             </div>`,
           });
           
           // Fallback to simple polyline if directions fail
           const points = [
             baseLocation,
             ...ordersWithCoords.map((order) => ({
               lat: order.customer.latitude,
               lng: order.customer.longitude,
             })),
             baseLocation,
           ];

           for (let i = 0; i < points.length - 1; i++) {
             const segmentColor = i === 0 ? "#4285F4" : routeColors[(i - 1) % routeColors.length];
             const polyline = new window.google.maps.Polyline({
               path: [points[i], points[i + 1]],
               geodesic: true,
               strokeColor: segmentColor,
               strokeOpacity: 0.8,
               strokeWeight: 6,
               icons: [
                 {
                                        icon: {
                       path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                       scale: 1.5,
                       fillColor: segmentColor,
                       fillOpacity: 0.8,
                       strokeColor: "#FFFFFF",
                       strokeWeight: 0.5,
                     },
                   offset: "50%",
                   repeat: "300px",
                 },
               ],
               map: map,
             });

             // Add info window for each segment
             const segmentInfoWindow = new window.google.maps.InfoWindow({
               content: `<div style="padding: 8px; min-width: 150px;">
                 <div style="display: flex; align-items: center; margin-bottom: 4px;">
                   <div style="width: 12px; height: 12px; background-color: ${segmentColor}; border-radius: 50%; margin-right: 8px;"></div>
                   <strong>Segment ${i + 1}</strong>
                 </div>
                 <strong>From:</strong> ${i === 0 ? 'Base Location' : `Customer ${i}`}<br>
                 <strong>To:</strong> ${i === points.length - 2 ? 'Base Location' : `Customer ${i + 1}`}<br>
                 <strong>Status:</strong> Fallback route (straight line)
                 ${i === 0 ? '<br><strong>Type:</strong> Base route' : ''}
               </div>`,
             });

             polyline.addListener("click", () => {
               const midPoint = {
                 lat: (points[i].lat + points[i + 1].lat) / 2,
                 lng: (points[i].lng + points[i + 1].lng) / 2,
               };
               segmentInfoWindow.setPosition(midPoint);
               segmentInfoWindow.open(map);
             });
           }
           
           // Show error message on base marker
           const baseMarker = new window.google.maps.Marker({
             position: baseLocation,
             map: map,
             title: selectedDriver 
               ? `Driver Base: ${selectedDriver.name} - Click for error details`
               : "Base Location (Berlin) - Click for error details",
             icon: {
               path: window.google.maps.SymbolPath.CIRCLE,
               scale: 15,
               fillColor: "#f44336",
               fillOpacity: 1,
               strokeColor: "#FFFFFF",
               strokeWeight: 3,
             },
           });

           baseMarker.addListener("click", () => {
             errorInfoWindow.setPosition(baseLocation);
             errorInfoWindow.open(map);
           });
         }
       });
     } else {
       setRouteLoading(false);
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
    setRouteInfo(null); // Clear route info when orders change
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

  // Generate and download manifest
  const downloadManifest = useCallback(() => {
    if (!selectedDriver || !selectedDate || orders.length === 0) return;

    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    // Create HTML content for PDF
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Delivery Manifest - ${selectedDriver.name} - ${formatDate(selectedDate)}</title>
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
            .route-info { background-color: #f0f8ff; padding: 10px; border-radius: 5px; margin: 10px 0; }
            .route-leg { margin: 5px 0; padding: 5px; background-color: #f9f9f9; border-left: 3px solid #007acc; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DELIVERY MANIFEST</h1>
            <h2>${selectedDriver.name} - ${formatDate(selectedDate)}</h2>
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
              <span class="info-label">Date:</span>
              <span>${formatDate(selectedDate)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Base Location:</span>
              <span>${selectedDriver.latitude && selectedDriver.longitude 
                ? `${selectedDriver.latitude.toFixed(4)}, ${selectedDriver.longitude.toFixed(4)}`
                : 'Berlin (Default)'}</span>
            </div>
          </div>

          <div class="section">
            <h3>Route Summary</h3>
            <div class="route-info">
              <div class="info-row">
                <span class="info-label">Total Orders:</span>
                <span>${orders.length}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Orders with Coordinates:</span>
                <span>${routePoints.length}</span>
              </div>
              ${routeInfo ? `
              <div class="info-row">
                <span class="info-label">Total Distance:</span>
                <span>${(routeInfo.totalDistance / 1000).toFixed(1)} km</span>
              </div>
              <div class="info-row">
                <span class="info-label">Total Duration:</span>
                <span>${Math.round(routeInfo.totalDuration / 60)} minutes</span>
              </div>
              ` : ''}
            </div>
          </div>

          ${routeInfo ? `
          <div class="section">
            <h3>Route Details</h3>
            ${routeInfo.legs.map((leg, index) => `
              <div class="route-leg">
                <strong>${index + 1}. ${leg.startAddress} → ${leg.endAddress}</strong><br>
                Distance: ${leg.distance} | Duration: ${leg.duration}
              </div>
            `).join('')}
          </div>
          ` : ''}

          <div class="section">
            <h3>Delivery Sequence</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Seq</th>
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
                ${draggableOrder.map((order, index) => {
                  const customer = order.customer;
                  const address = `${customer.street} ${customer.houseNumber}, ${customer.postalCode} ${customer.city}`;
                  const mobile = customer.mobileNumber || 'N/A';
                  const email = customer.email || 'N/A';
                  const amount = order.totalGrossAmount ? `€${order.totalGrossAmount.toFixed(2)}` : 'N/A';
                  const status = order.status || 'N/A';
                  const paymentMethod = order.paymentMethod ? ` (${order.paymentMethod.replace('_', ' ').toUpperCase()})` : '';

                  return `
                    <tr>
                      <td>${index + 1}</td>
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

          ${(() => {
            const ordersWithNotes = draggableOrder.filter(order => order.driverNote);
            if (ordersWithNotes.length > 0) {
              return `
                <div class="section">
                  <h3>Driver Notes</h3>
                  ${ordersWithNotes.map((order, index) => `
                    <div class="route-leg">
                      <strong>${order.orderNumber} - ${order.customer.name}</strong><br>
                      ${order.driverNote}
                    </div>
                  `).join('')}
                </div>
              `;
            }
            return '';
          })()}

          ${(() => {
            const ordersWithoutCoords = orders.filter(order => 
              !order.customer.latitude || !order.customer.longitude
            );
            
            if (ordersWithoutCoords.length > 0) {
              return `
                <div class="section">
                  <h3>Orders Without Coordinates (Not in Route)</h3>
                    ${ordersWithoutCoords.map((order, index) => {
                     const customer = order.customer;
                     const address = `${customer.street} ${customer.houseNumber}, ${customer.postalCode} ${customer.city}`;
                     const mobile = customer.mobileNumber || 'N/A';
                     const email = customer.email || 'N/A';
                     const amount = order.totalGrossAmount ? `€${order.totalGrossAmount.toFixed(2)}` : 'N/A';
                     const status = order.status || 'N/A';
                     const paymentMethod = order.paymentMethod ? ` (${order.paymentMethod.replace('_', ' ').toUpperCase()})` : '';

                     return `
                       <div class="route-leg">
                         <strong>${index + 1}. Order #${order.orderNumber} - ${customer.name}</strong><br>
                         Address: ${address}<br>
                         Mobile: ${mobile} | Email: ${email}<br>
                         Amount: ${amount}${paymentMethod} | Status: ${status}
                         ${order.driverNote ? `<br><strong>Note:</strong> ${order.driverNote}` : ''}
                       </div>
                     `;
                   }).join('')}
                </div>
              `;
            }
            return '';
          })()}

          <div class="footer">
            <p>This manifest was generated automatically from the delivery route planning system.</p>
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
  }, [selectedDriver, selectedDate, orders, draggableOrder, routeInfo, routePoints]);

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
          {selectedDriver && selectedDate && orders.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={downloadManifest}
                size="small"
              >
                Download Manifest
              </Button>
            </Box>
          )}
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
                  Starting from {selectedDriver?.name ? `${selectedDriver.name}'s location` : 'Berlin base location'}
                </Typography>
                {routeLoading && (
                  <Box sx={{ mt: 2, p: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                      Calculating optimized route...
                    </Typography>
                  </Box>
                )}
                {routeInfo && !routeLoading && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: "primary.50", borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      🚗 Optimized Route Information
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
                      <Typography variant="body2">
                        <strong>Total Distance:</strong> {(routeInfo.totalDistance / 1000).toFixed(1)} km
                      </Typography>
                      <Typography variant="body2">
                        <strong>Total Duration:</strong> {Math.round(routeInfo.totalDuration / 60)} minutes
                      </Typography>
                      <Typography variant="body2">
                        <strong>Stops:</strong> {routeInfo.legs.length - 1}
                      </Typography>
                    </Box>
                    
                    {/* Route Color Legend */}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Route Segments:
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                        {routeInfo.legs.slice(0, 6).map((leg, index) => (
                          <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: "50%",
                                backgroundColor: index === 0 ? "#4285F4" : routeColors[(index - 1) % routeColors.length],
                                border: "1px solid #ccc",
                              }}
                            />
                            <Typography variant="caption">
                              {index === 0 ? "Base" : `Stop ${index}`} → {index === routeInfo.legs.length - 1 ? "Base" : `Stop ${index + 1}`}
                            </Typography>
                          </Box>
                        ))}
                        {routeInfo.legs.length > 6 && (
                          <Typography variant="caption" color="text.secondary">
                            +{routeInfo.legs.length - 6} more segments
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                )}
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
                {routeInfo && (
                  <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                    🛣️ Showing optimized road routes with real-time traffic data
                  </Typography>
                )}
                {!routeInfo && routePoints.length > 0 && !routeLoading && (
                  <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                    ⚠️ Using fallback route calculation (straight lines)
                  </Typography>
                )}
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
