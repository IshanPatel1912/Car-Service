import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car as CarIcon, Wrench, IndianRupee, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getCarsByUser } from "@/services/carService";
import { getRecordsByUser } from "@/services/recordService";
import type { Car, ServiceRecord } from "@/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const [fetchedCars, fetchedRecords] = await Promise.all([
          getCarsByUser(currentUser.uid),
          getRecordsByUser(currentUser.uid)
        ]);
        setCars(fetchedCars);
        setRecords(fetchedRecords);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [currentUser]);

  // 1. Calculate Total Expenses
  const totalExpenses = records.reduce((sum, record) => sum + record.totalCost, 0);
  
  // 2. Action Needed Logic (Exact Date)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  const needsAttention = cars.find(c => {
    if (!c.pucExpiry || !c.insuranceExpiry) return true; 
    
    const pucDate = new Date(c.pucExpiry);
    const insDate = new Date(c.insuranceExpiry);
    
    return pucDate <= thirtyDaysFromNow || insDate <= thirtyDaysFromNow;
  });

  let actionMessage = "All Clear";
  let actionSubtext = "No immediate actions required";

  if (needsAttention) {
    actionMessage = `${needsAttention.brand} ${needsAttention.model}`;
    if (!needsAttention.pucExpiry || !needsAttention.insuranceExpiry) {
      actionSubtext = "Missing PUC or Insurance Date";
    } else {
      const pucDate = new Date(needsAttention.pucExpiry);
      const insDate = new Date(needsAttention.insuranceExpiry);
      const formatDate = (d: Date) => d.toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' });
      
      const pucExpiring = pucDate <= thirtyDaysFromNow;
      const insExpiring = insDate <= thirtyDaysFromNow;

      if (pucExpiring && insExpiring) {
        actionSubtext = `PUC (${formatDate(pucDate)}) & Ins (${formatDate(insDate)})`;
      } else if (pucExpiring) {
        actionSubtext = `PUC expires on ${formatDate(pucDate)}`;
      } else {
        actionSubtext = `Insurance expires on ${formatDate(insDate)}`;
      }
    }
  }

  // 3. Prepare Chart Data: Expenses by Month
  const monthlyData = records.reduce((acc: any[], record) => {
    const monthYear = new Date(record.serviceDate).toLocaleDateString('default', { month: 'short', year: 'numeric' });
    const existing = acc.find(item => item.name === monthYear);
    if (existing) {
      existing.cost += record.totalCost;
    } else {
      acc.push({ name: monthYear, cost: record.totalCost });
    }
    return acc;
  }, []).reverse(); 

  // 4. Prepare Chart Data: Expenses by Category
  const categoryData = records.reduce((acc: any[], record) => {
    const existing = acc.find(item => item.name === record.serviceType);
    if (existing) {
      existing.value += record.totalCost;
    } else {
      acc.push({ name: record.serviceType, value: record.totalCost });
    }
    return acc;
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your garage and expenses.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cars</CardTitle>
            <CarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cars.length}</div>
            <p className="text-xs text-muted-foreground">Active vehicles in garage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Lifetime maintenance cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Records</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{records.length}</div>
            <p className="text-xs text-muted-foreground">Logged service events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Action Needed</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${needsAttention ? 'text-orange-500' : 'text-green-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{actionMessage}</div>
            <p className="text-xs text-muted-foreground">{actionSubtext}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Interactive Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip cursor={{fill: 'transparent'}} formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Cost']} />
                  <Bar dataKey="cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">No expense data available.</div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Total Cost']} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">No category data available.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}