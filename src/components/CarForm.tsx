import { useState, useEffect } from "react";
import type { Car } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { addCar, updateCar } from "@/services/carService";

interface CarFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Car | null;
}

export default function CarForm({ isOpen, onClose, onSuccess, initialData }: CarFormProps) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    brand: "", model: "", registrationNumber: "", fuelType: "Petrol", 
    purchaseDate: "", insuranceExpiry: "", pucExpiry: "", odometer: 0, notes: ""
  });

  // Pre-fill form if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        brand: initialData.brand, model: initialData.model, registrationNumber: initialData.registrationNumber,
        fuelType: initialData.fuelType, purchaseDate: initialData.purchaseDate || "", 
        insuranceExpiry: initialData.insuranceExpiry || "", pucExpiry: initialData.pucExpiry || "",
        odometer: initialData.odometer, notes: initialData.notes || ""
      });
    } else {
      setFormData({ brand: "", model: "", registrationNumber: "", fuelType: "Petrol", purchaseDate: "", insuranceExpiry: "", pucExpiry: "", odometer: 0, notes: "" });
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === "odometer" ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);

    try {
      if (initialData?.id) {
        await updateCar(initialData.id, formData);
      } else {
        await addCar({ ...formData, userId: currentUser.uid });
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving car:", error);
      alert("Failed to save car. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Car" : "Add New Car"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Brand *</Label>
              <Input name="brand" required value={formData.brand} onChange={handleChange} placeholder="e.g. Tata" />
            </div>
            <div className="space-y-2">
              <Label>Model *</Label>
              <Input name="model" required value={formData.model} onChange={handleChange} placeholder="e.g. Nexon" />
            </div>
            <div className="space-y-2">
              <Label>Registration Number *</Label>
              <Input name="registrationNumber" required value={formData.registrationNumber} onChange={handleChange} placeholder="GJ-01-XX-1234" />
            </div>
            <div className="space-y-2">
              <Label>Fuel Type *</Label>
              <Select value={formData.fuelType} onValueChange={(value) => setFormData(prev => ({ ...prev, fuelType: value }))}>
                <SelectTrigger><SelectValue placeholder="Select fuel type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Petrol">Petrol</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="EV">EV</SelectItem>
                  <SelectItem value="CNG">CNG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Current Odometer (km) *</Label>
              <Input name="odometer" type="number" required value={formData.odometer} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Purchase Date</Label>
              <Input name="purchaseDate" type="date" value={formData.purchaseDate} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Insurance Expiry</Label>
              <Input name="insuranceExpiry" type="date" value={formData.insuranceExpiry} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>PUC Expiry</Label>
              <Input name="pucExpiry" type="date" value={formData.pucExpiry} onChange={handleChange} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Any specific details..." />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Car"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}