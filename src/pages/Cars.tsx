import { useEffect, useState } from "react";
import type { Car } from "@/types";
import { getCarsByUser, deleteCar } from "@/services/carService";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import CarForm from "@/components/CarForm";

export default function Cars() {
  const { currentUser } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);

  const fetchCars = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const userCars = await getCarsByUser(currentUser.uid);
      setCars(userCars);
    } catch (error) {
      console.error("Error fetching cars:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, [currentUser]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this car? This action cannot be undone.")) {
      await deleteCar(id);
      fetchCars();
    }
  };

  const handleEdit = (car: Car) => {
    setEditingCar(car);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingCar(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Cars</h1>
          <p className="text-muted-foreground">Manage your vehicles and their details.</p>
        </div>
        <Button onClick={handleAddNew} className="gap-2">
          <Plus className="h-4 w-4" /> Add Car
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Loading cars...</div>
      ) : cars.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-lg text-muted-foreground">
          No cars found. Click "Add Car" to get started.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cars.map((car) => (
            <Card key={car.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50 pb-4">
                <CardTitle className="flex justify-between items-start">
                  <span>{car.brand} {car.model}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(car)}>
                      <Pencil className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(car.id!)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription className="font-mono">{car.registrationNumber}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-2 gap-y-2 text-sm">
                <div className="text-muted-foreground">Fuel</div>
                <div className="font-medium text-right">{car.fuelType}</div>
                <div className="text-muted-foreground">Odometer</div>
                <div className="font-medium text-right">{car.odometer.toLocaleString()} km</div>
                <div className="text-muted-foreground">Insurance</div>
                <div className="font-medium text-right">{car.insuranceExpiry || "N/A"}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CarForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSuccess={fetchCars}
        initialData={editingCar}
      />
    </div>
  );
}