import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "./firebase";
import type { ServiceRecord } from "@/types";

const RECORDS_COLLECTION = "services";

export const addRecord = async (recordData: Omit<ServiceRecord, "id" | "createdAt">) => {
  const docRef = await addDoc(collection(db, RECORDS_COLLECTION), {
    ...recordData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getRecordsByUser = async (userId: string): Promise<ServiceRecord[]> => {
  const q = query(
    collection(db, RECORDS_COLLECTION), 
    where("userId", "==", userId),
    orderBy("serviceDate", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as ServiceRecord[];
};

export const updateRecord = async (recordId: string, recordData: Partial<ServiceRecord>) => {
  const recordRef = doc(db, RECORDS_COLLECTION, recordId);
  await updateDoc(recordRef, recordData);
};

export const deleteRecord = async (recordId: string) => {
  const recordRef = doc(db, RECORDS_COLLECTION, recordId);
  await deleteDoc(recordRef);
};