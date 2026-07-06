import type { Car, ServiceRecord, ServiceItem } from "@/types";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { addRecord, updateRecord } from "@/services/recordService";
import { uploadFileToDrive } from "@/services/driveService";
import { Plus, Trash2, UploadCloud } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";

interface ServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cars: Car[];
  initialData?: ServiceRecord | null;
}

export default function ServiceForm({ isOpen, onClose, onSuccess, cars, initialData }: ServiceFormProps) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    carId: "", serviceDate: new Date().toISOString().split('T')[0], 
    odometer: 0, garageName: "", workDone: "", serviceType: "Maintenance", 
    tags: "", notes: ""
  });

  const [items, setItems] = useState<ServiceItem[]>([]);
  const [billFile, setBillFile] = useState<File | null>(null);

  // Google Login Hook to request Drive scope
  const loginToGoogleDrive = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/drive.file',
    onSuccess: async (tokenResponse) => {
      await processSave(tokenResponse.access_token);
    },
    onError: (error) => {
      console.error('Google Login Failed:', error);
      setLoading(false);
      alert("Failed to connect to Google Drive.");
    }
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        carId: initialData.carId, serviceDate: initialData.serviceDate, 
        odometer: initialData.odometer, garageName: initialData.garageName, 
        workDone: initialData.workDone, serviceType: initialData.serviceType, 
        tags: initialData.tags.join(", "), notes: initialData.notes || ""
      });
      setItems(initialData.items || []);
    } else {
      setFormData({ 
        carId: cars.length > 0 ? cars[0].id! : "", 
        serviceDate: new Date().toISOString().split('T')[0], 
        odometer: 0, garageName: "", workDone: "", serviceType: "Maintenance", 
        tags: "", notes: "" 
      });
      setItems([]);
    }
    setBillFile(null);
  }, [initialData, isOpen, cars]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === "odometer" ? Number(value) : value }));
  };

  const handleAddItem = () => {
    setItems([...items, { id: crypto.randomUUID(), name: "", quantity: 1, price: 0 }]);
  };

  const handleUpdateItem = (id: string, field: keyof ServiceItem, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const totalCost = items.reduce((sum, item) => sum + Number(item.price), 0);

  // Triggered when user clicks Save
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !formData.carId) return;
    setLoading(true);

    if (billFile) {
      // If there is a file, we MUST get Drive permission first
      loginToGoogleDrive();
    } else {
      // If no file, just save to Firestore directly
      processSave(null);
    }
  };

  // Separated save logic to handle both with and without Drive upload
  const processSave = async (googleAccessToken: string | null) => {
    try {
      let uploadedFileId = initialData?.pdfBillId || "";

      if (billFile && googleAccessToken) {
        uploadedFileId = await uploadFileToDrive(billFile, googleAccessToken);
      }

      const recordPayload = {
        ...formData,
        userId: currentUser!.uid,
        tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        items,
        totalCost,
        pdfBillId: uploadedFileId, // Save the Drive ID here
      };

      if (initialData?.id) {
        await updateRecord(initialData.id, recordPayload);
      } else {
        await addRecord(recordPayload);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving record:", error);
      alert("An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Service Record" : "Log New Service"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Select Car *</Label>
              <Select value={formData.carId} onValueChange={(v) => setFormData(p => ({ ...p, carId: v }))}>
                <SelectTrigger><SelectValue placeholder="Which car?" /></SelectTrigger>
                <SelectContent>
                  {cars.map(car => (
                    <SelectItem key={car.id} value={car.id!}>{car.brand} {car.model} ({car.registrationNumber})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Service Date *</Label>
              <Input name="serviceDate" type="date" required value={formData.serviceDate} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Odometer (km) *</Label>
              <Input name="odometer" type="number" required value={formData.odometer} onChange={handleChange} />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Garage Name *</Label>
              <Input name="garageName" required value={formData.garageName} onChange={handleChange} />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Service Type *</Label>
              <Select value={formData.serviceType} onValueChange={(v) => setFormData(p => ({ ...p, serviceType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Maintenance">Regular Maintenance</SelectItem>
                  <SelectItem value="Repair">Repair</SelectItem>
                  <SelectItem value="Modification">Modification</SelectItem>
                  <SelectItem value="Washing">Washing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Itemized Bill Section */}
          <div className="space-y-3 p-3 sm:p-4 bg-muted/50 rounded-lg border">
            <div className="flex justify-between items-center pb-2">
              <Label className="text-base font-semibold">Itemized Bill</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Add Item</span>
              </Button>
            </div>
            {items.length === 0 && <p className="text-sm text-muted-foreground">No items added yet. Click "Add Item" to list parts/labor.</p>}
            
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-background border sm:border-transparent p-3 sm:p-0 rounded-md">
                  <Input 
                    placeholder="Part or Labor Name" 
                    className="w-full sm:flex-1" 
                    value={item.name} 
                    required 
                    onChange={(e) => handleUpdateItem(item.id, "name", e.target.value)} 
                  />
                  <div className="flex gap-2 w-full sm:w-auto items-center">
                    <Input 
                      type="number" 
                      placeholder="Qty" 
                      className="w-20" 
                      value={item.quantity} 
                      required 
                      min="1" 
                      onChange={(e) => handleUpdateItem(item.id, "quantity", Number(e.target.value))} 
                    />
                    <Input 
                      type="number" 
                      placeholder="Total Cost (₹)" 
                      className="flex-1 sm:w-32" 
                      value={item.price} 
                      required 
                      min="0" 
                      onChange={(e) => handleUpdateItem(item.id, "price", Number(e.target.value))} 
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="shrink-0"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-3 mt-2 border-t text-lg font-bold">
              Total: ₹{totalCost.toLocaleString()}
            </div>
          </div>

          {/* Description & File Upload */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Work Done Summary *</Label>
              <Textarea name="workDone" required value={formData.workDone} onChange={handleChange} placeholder="Briefly describe the overall service..." />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Tags (comma separated)</Label>
              <Input name="tags" placeholder="Oil, Brakes" value={formData.tags} onChange={handleChange} />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Attach Bill (PDF/Image)</Label>
              <div className="flex items-center gap-2">
                <Input type="file" accept=".pdf,image/*" onChange={(e) => setBillFile(e.target.files?.[0] || null)} className="file:text-foreground w-full" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading || !formData.carId}>{loading ? "Saving..." : "Save Record"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}