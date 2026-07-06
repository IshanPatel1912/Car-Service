import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "./firebase";
import type { Car } from "@/types";

const CARS_COLLECTION = "cars";

export const addCar = async (carData: Omit<Car, "id" | "createdAt">) => {
  const docRef = await addDoc(collection(db, CARS_COLLECTION), {
    ...carData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getCarsByUser = async (userId: string): Promise<Car[]> => {
  const q = query(
    collection(db, CARS_COLLECTION), 
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Car[];
};

export const updateCar = async (carId: string, carData: Partial<Car>) => {
  const carRef = doc(db, CARS_COLLECTION, carId);
  await updateDoc(carRef, carData);
};

export const deleteCar = async (carId: string) => {
  const carRef = doc(db, CARS_COLLECTION, carId);
  await deleteDoc(carRef);
};