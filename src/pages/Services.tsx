import { useEffect, useState } from "react";
import type { Car, ServiceRecord } from "@/types";
import { getCarsByUser } from "@/services/carService";
import { getRecordsByUser, deleteRecord } from "@/services/recordService";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Calendar, MapPin, Car as CarIcon, Search, ExternalLink, Filter, ArrowUpDown } from "lucide-react";
import ServiceForm from "@/components/ServiceForm";

export default function Services() {
  const { currentUser } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ServiceRecord | null>(null);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterCar, setFilterCar] = useState("All");
  const [sortBy, setSortBy] = useState("date_desc");

  const fetchData = async () => {
    if (!currentUser) return;
    setLoading(true);
    
    try {
      const fetchedCars = await getCarsByUser(currentUser.uid);
      setCars(fetchedCars);
    } catch (error) {
      console.error("Error fetching cars:", error);
    }

    try {
      const fetchedRecords = await getRecordsByUser(currentUser.uid);
      setRecords(fetchedRecords);
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this record?")) {
      await deleteRecord(id);
      fetchData();
    }
  };

  const getCarName = (carId: string) => {
    const car = cars.find(c => c.id === carId);
    return car ? `${car.brand} ${car.model}` : "Unknown Car";
  };

  const handleViewBill = (fileId: string) => {
    window.open(`https://drive.google.com/file/d/${fileId}/view`, "_blank");
  };

  // Search, Filter, and Sort Logic (Client-Side)
  const processedRecords = records
    .filter((record) => {
      const query = searchQuery.toLowerCase();
      // Search fields: work done, garage name, service type, notes, tags
      const matchesSearch =
        record.workDone.toLowerCase().includes(query) ||
        record.garageName.toLowerCase().includes(query) ||
        record.serviceType.toLowerCase().includes(query) ||
        (record.notes && record.notes.toLowerCase().includes(query)) ||
        (record.tags && record.tags.some(tag => tag.toLowerCase().includes(query))) ||
        (record.items && record.items.some(item => item.name.toLowerCase().includes(query))); // <-- This new line searches your parts!

      const matchesFilter = filterType === "All" || record.serviceType === filterType;
      const matchesCar = filterCar === "All" || record.carId === filterCar; 

      return matchesSearch && matchesFilter && matchesCar;

      
    })
    .sort((a, b) => {
      if (sortBy === "date_desc") return new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime();
      if (sortBy === "date_asc") return new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime();
      if (sortBy === "cost_desc") return b.totalCost - a.totalCost;
      if (sortBy === "cost_asc") return a.totalCost - b.totalCost;
      return 0;
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Records</h1>
          <p className="text-muted-foreground">Track maintenance, repairs, and expenses.</p>
        </div>
        <Button onClick={() => { setEditingRecord(null); setIsFormOpen(true); }} disabled={cars.length === 0}>
          <Plus className="mr-2 h-4 w-4" /> Log Service
        </Button>
      </div>

      {cars.length === 0 && (
        <div className="p-4 bg-orange-50 text-orange-800 rounded-md border border-orange-200">
          You need to add a car before you can log a service. Go to the "My Cars" tab first.
        </div>
      )}

      {/* Search and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-muted/30 p-3 rounded-lg border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search work done, tags, garage..." 
            className="pl-9 bg-background" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px] bg-background">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
              <SelectItem value="Repair">Repair</SelectItem>
              <SelectItem value="Modification">Modification</SelectItem>
              <SelectItem value="Washing">Washing</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCar} onValueChange={setFilterCar}>
            <SelectTrigger className="w-[160px] bg-background">
              <CarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Cars" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Cars</SelectItem>
              {cars.map(car => (
                <SelectItem key={car.id!} value={car.id!}>{car.brand} {car.model}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] bg-background">
              <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Newest First</SelectItem>
              <SelectItem value="date_asc">Oldest First</SelectItem>
              <SelectItem value="cost_desc">Highest Cost</SelectItem>
              <SelectItem value="cost_asc">Lowest Cost</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading records...</div>
      ) : processedRecords.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-lg text-muted-foreground">
          {records.length === 0 ? "No service records found." : "No records match your search."}
        </div>
      ) : (
        <div className="space-y-4">
          {processedRecords.map((record) => (
            <Card key={record.id}>
              <CardHeader className="pb-2 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <CardTitle className="text-lg">{record.workDone}</CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-4 mt-1">
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <CarIcon className="h-3 w-3" /> {getCarName(record.carId)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {record.serviceDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {record.garageName}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex gap-2 items-center w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-xl font-bold mr-2 sm:mr-4">₹{record.totalCost.toLocaleString()}</div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingRecord(record); setIsFormOpen(true); }}>
                      <Pencil className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(record.id!)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap mb-4">
                  <Badge variant="secondary">{record.serviceType}</Badge>
                  {record.tags?.map(tag => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
                
                {record.items && record.items.length > 0 && (
                  <div className="mb-4 bg-muted/30 rounded border p-3">
                    <h4 className="text-sm font-semibold mb-2">Itemized Breakdown</h4>
                    <div className="space-y-1">
                      {record.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.name} (x{item.quantity})</span>
                          <span className="font-medium">₹{item.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mt-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Odometer: {record.odometer.toLocaleString()} km</div>
                    {record.notes && <div className="text-sm mt-1 text-muted-foreground italic">{record.notes}</div>}
                  </div>
                  
                  {/* View Bill Button */}
                  {record.pdfBillId && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4 sm:mt-0 gap-2"
                      onClick={() => handleViewBill(record.pdfBillId!)}
                    >
                      <ExternalLink className="h-4 w-4" /> View Attached Bill
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ServiceForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSuccess={fetchData}
        cars={cars}
        initialData={editingRecord}
      />
    </div>
  );
}