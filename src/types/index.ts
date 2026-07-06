export interface Car {
  id?: string;
  userId: string;
  brand: string;
  model: string;
  registrationNumber: string;
  fuelType: string;
  purchaseDate?: string;
  insuranceExpiry?: string;
  pucExpiry?: string;
  odometer: number;
  notes?: string;
  photoId?: string; 
  createdAt?: any; 
}

export interface ServiceItem {
  id: string;
  name: string;
  quantity: number;
  price: number; // Total price for this specific item/quantity
}

export interface ServiceRecord {
  id?: string;
  userId: string;
  carId: string;
  serviceDate: string;
  odometer: number;
  garageName: string;
  workDone: string;
  serviceType: string;
  tags: string[];
  items: ServiceItem[]; // NEW: Array of bill items
  totalCost: number; // This will now be auto-calculated
  notes?: string;
  pdfBillId?: string; 
  imageBillId?: string; 
  createdAt?: any;
}