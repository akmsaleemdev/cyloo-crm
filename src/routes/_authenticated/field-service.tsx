import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppTopbar } from "@/components/app/app-topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Wrench,
  Plus,
  Search,
  MapPin,
  Clock,
  UserCheck,
  CheckCircle2,
  Navigation,
  FileCheck2,
  Truck,
  Package,
  Camera,
  Signature,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/field-service")({
  component: FieldServicePage,
  staticData: { breadcrumb: "Field Service" },
  head: () => ({
    meta: [
      { title: "Field Service & Mobile Dispatch | CYLOO CRM" },
      {
        name: "description",
        content:
          "Enterprise field service management, technician dispatching, mobile work orders, GPS route tracking, and digital proof-of-service.",
      },
    ],
  }),
});

interface WorkOrder {
  id: string;
  customerName: string;
  siteAddress: string;
  technicianName: string;
  serviceType: "Installation" | "Preventive Maintenance" | "Emergency Repair" | "Site Inspection";
  priority: "Emergency" | "High" | "Standard";
  status: "dispatched" | "in_transit" | "on_site" | "completed";
  scheduledTime: string;
  partsConsumed?: string[];
  signatureStamp?: string;
}

interface Technician {
  id: string;
  name: string;
  status: "available" | "in_transit" | "on_site" | "off_shift";
  currentLocation: string;
  skills: string[];
  todayJobsCount: number;
}

const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: "WO-9021",
    customerName: "DAMAC Hills Luxury Villas Management",
    siteAddress: "Villa 412, DAMAC Hills, Dubai, UAE",
    technicianName: "Hamza Farooq",
    serviceType: "Installation",
    priority: "High",
    status: "on_site",
    scheduledTime: "10:30 AM - 12:30 PM",
    partsConsumed: ["IoT Gateway Hub v4", "High-Gain 5G Antenna"],
  },
  {
    id: "WO-9022",
    customerName: "Dr. Sulaiman Al-Habib Hospital",
    siteAddress: "Building 3, Olaya District, Riyadh, KSA",
    technicianName: "Zaid Al-Harbi",
    serviceType: "Emergency Repair",
    priority: "Emergency",
    status: "in_transit",
    scheduledTime: "11:15 AM - 01:00 PM",
  },
  {
    id: "WO-9023",
    customerName: "The Pearl Marina Tower 14",
    siteAddress: "Tower 14, Porto Arabia, Doha, Qatar",
    technicianName: "Bilal Mansoori",
    serviceType: "Preventive Maintenance",
    priority: "Standard",
    status: "completed",
    scheduledTime: "08:00 AM - 10:00 AM",
    partsConsumed: ["Diagnostic Sensor Pack"],
    signatureStamp: "Signed by Facility Manager (GPS: 25.3712° N, 51.5434° E)",
  },
  {
    id: "WO-9024",
    customerName: "Kuwait Oil Company Operations",
    siteAddress: "Ahmadi Industrial Area, Block 6, Kuwait",
    technicianName: "Mustafa Nabil",
    serviceType: "Site Inspection",
    priority: "Standard",
    status: "dispatched",
    scheduledTime: "02:00 PM - 04:00 PM",
  },
];

const TECHNICIANS: Technician[] = [
  {
    id: "TECH-01",
    name: "Hamza Farooq",
    status: "on_site",
    currentLocation: "Dubai (DAMAC Hills)",
    skills: ["IoT Hardware", "5G Gateways", "Fiber Splice"],
    todayJobsCount: 3,
  },
  {
    id: "TECH-02",
    name: "Zaid Al-Harbi",
    status: "in_transit",
    currentLocation: "Riyadh (Olaya Highway)",
    skills: ["Emergency Repair", "Medical Systems", "Power Backup"],
    todayJobsCount: 4,
  },
  {
    id: "TECH-03",
    name: "Bilal Mansoori",
    status: "available",
    currentLocation: "Doha (West Bay Dispatch Hub)",
    skills: ["Diagnostics", "HVAC Control", "Network"],
    todayJobsCount: 2,
  },
];

export function FieldServicePage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(INITIAL_WORK_ORDERS);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("work_orders");
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [customer, setCustomer] = useState("");
  const [address, setAddress] = useState("");
  const [serviceType, setServiceType] = useState<WorkOrder["serviceType"]>("Installation");
  const [technician, setTechnician] = useState("Hamza Farooq");

  const handleCreateOrder = () => {
    if (!customer.trim() || !address.trim()) {
      toast.error("Please fill in customer name and site address.");
      return;
    }
    const newOrder: WorkOrder = {
      id: `WO-${Math.floor(9000 + Math.random() * 999)}`,
      customerName: customer,
      siteAddress: address,
      technicianName: technician,
      serviceType,
      priority: "Standard",
      status: "dispatched",
      scheduledTime: "01:30 PM - 03:30 PM",
    };
    setWorkOrders([newOrder, ...workOrders]);
    setNewOrderOpen(false);
    setCustomer("");
    setAddress("");
    toast.success("New work order dispatched to technician.");
  };

  const handleSignOff = (id: string) => {
    setWorkOrders((prev) =>
      prev.map((wo) =>
        wo.id === id
          ? {
              ...wo,
              status: "completed",
              signatureStamp: `Verified Digital Signature (GPS: 25.2048° N, 55.2708° E at ${new Date().toLocaleTimeString()})`,
            }
          : wo,
      ),
    );
    toast.success("Proof-of-service captured: Customer signature & GPS location stored.");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppTopbar title="Field Service" showPageHeader={false} />
      <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Field Service & Workforce Dispatch
              </h1>
              <Badge
                variant="outline"
                className="text-xs bg-primary/10 text-primary border-primary/20"
              >
                Module 24 • Hub 5
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Smart technician dispatching, mobile work orders, GPS route tracking, and digital
              proof-of-service.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={newOrderOpen} onOpenChange={setNewOrderOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> Create Work Order
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Dispatch New Work Order</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Client Organization / Customer
                    </label>
                    <Input
                      placeholder="e.g. Al-Futtaim Motors"
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      On-Site Location / Address
                    </label>
                    <Input
                      placeholder="e.g. Dubai Festival City, Showroom 4"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Service Type
                      </label>
                      <select
                        aria-label="Service Type"
                        className="w-full h-9 px-3 rounded-md border bg-background text-sm mt-1"
                        value={serviceType}
                        onChange={(e) => setServiceType(e.target.value as WorkOrder["serviceType"])}
                      >
                        <option value="Installation">Installation</option>
                        <option value="Preventive Maintenance">Maintenance</option>
                        <option value="Emergency Repair">Emergency Repair</option>
                        <option value="Site Inspection">Inspection</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Assign Technician
                      </label>
                      <select
                        aria-label="Assign Technician"
                        className="w-full h-9 px-3 rounded-md border bg-background text-sm mt-1"
                        value={technician}
                        onChange={(e) => setTechnician(e.target.value)}
                      >
                        {TECHNICIANS.map((t) => (
                          <option key={t.id} value={t.name}>
                            {t.name} ({t.status})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewOrderOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateOrder}>Dispatch Work Order</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Today's Work Orders</p>
                <p className="text-2xl font-bold mt-1">{workOrders.length}</p>
              </div>
              <div className="p-2.5 rounded-full bg-primary/10 text-primary">
                <Wrench className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Technicians Active</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600">{TECHNICIANS.length}</p>
              </div>
              <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-600">
                <UserCheck className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Emergency Repairs</p>
                <p className="text-2xl font-bold mt-1 text-rose-600">
                  {workOrders.filter((w) => w.priority === "Emergency").length}
                </p>
              </div>
              <div className="p-2.5 rounded-full bg-rose-500/10 text-rose-600">
                <Truck className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Completed Today</p>
                <p className="text-2xl font-bold mt-1 text-blue-600">
                  {workOrders.filter((w) => w.status === "completed").length}
                </p>
              </div>
              <div className="p-2.5 rounded-full bg-blue-500/10 text-blue-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <TabsList>
              <TabsTrigger value="work_orders">Work Orders ({workOrders.length})</TabsTrigger>
              <TabsTrigger value="technicians">
                Active Technicians & Fleet ({TECHNICIANS.length})
              </TabsTrigger>
              <TabsTrigger value="parts">Truck-Stock Parts</TabsTrigger>
            </TabsList>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search job or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>

          <TabsContent value="work_orders" className="space-y-3">
            <div className="rounded-lg border bg-card overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
                  <tr>
                    <th className="px-4 py-3">Order Ref & Customer</th>
                    <th className="px-4 py-3">Site Address</th>
                    <th className="px-4 py-3">Service Type</th>
                    <th className="px-4 py-3">Assigned Tech</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Scheduled Slot</th>
                    <th className="px-4 py-3 text-right">Proof of Service</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {workOrders.map((wo) => (
                    <tr key={wo.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <div className="text-foreground">{wo.customerName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{wo.id}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs flex items-center gap-1.5 pt-4">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        {wo.siteAddress}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {wo.serviceType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-xs">{wo.technicianName}</td>
                      <td className="px-4 py-3">
                        {wo.status === "on_site" && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                            On Site (Active)
                          </Badge>
                        )}
                        {wo.status === "in_transit" && (
                          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs gap-1">
                            <Navigation className="w-3 h-3" /> In Transit
                          </Badge>
                        )}
                        {wo.status === "dispatched" && (
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
                            Dispatched
                          </Badge>
                        )}
                        {wo.status === "completed" && (
                          <Badge className="bg-muted text-muted-foreground text-xs">
                            Completed & Verified
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {wo.scheduledTime}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {wo.status !== "completed" ? (
                          <Button
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => handleSignOff(wo.id)}
                          >
                            <FileCheck2 className="w-3.5 h-3.5" /> Sign-Off
                          </Button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-medium">
                            ✓ Signed & Geotagged
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="technicians" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TECHNICIANS.map((tech) => (
                <Card key={tech.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          tech.status === "available"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        }`}
                      >
                        {tech.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">{tech.id}</span>
                    </div>
                    <CardTitle className="text-base mt-2">{tech.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 text-xs">
                      <MapPin className="w-3 h-3 text-primary" /> {tech.currentLocation}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs space-y-3">
                    <div>
                      <div className="text-muted-foreground mb-1.5 font-medium">
                        Certified Skills:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {tech.skills.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded bg-muted text-foreground text-[11px]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="pt-2 border-t flex justify-between text-muted-foreground">
                      <span>Assigned Jobs Today:</span>
                      <span className="font-semibold text-foreground">{tech.todayJobsCount}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="parts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mobile Truck-Stock Inventory</CardTitle>
                <CardDescription>
                  Real-time stock levels of critical hardware and spare parts in field vehicles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-medium text-sm">IoT Gateway Hub v4</div>
                        <div className="text-xs text-muted-foreground">
                          SKU: IOT-GTW-04 • Universal 5G
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      18 units in fleet
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-medium text-sm">Diagnostic Sensor Pack</div>
                        <div className="text-xs text-muted-foreground">
                          SKU: SEN-DSP-09 • Calibrated
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      34 units in fleet
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
