import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Clock, Users, AlertTriangle, CheckCircle2, Timer, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Language } from "@/lib/i18n";

// Definizione dei tipi per i dati di performance
interface KitchenPerformanceData {
  orderPrepTime: {
    averageTimeByDay: Array<{
      date: string;
      averageMinutes: number;
    }>;
    averageTimeByCategory: Array<{
      category: string;
      averageMinutes: number;
    }>;
    busyHours: Array<{
      hour: number;
      orderCount: number;
      averageMinutes: number;
    }>;
  };
  efficiency: {
    completedOrders: number;
    totalOrders: number;
    onTimePercentage: number;
    latePercentage: number;
  };
  bottlenecks: Array<{
    item: string;
    category: string;
    prepTime: number;
    orderCount: number;
  }>;
  staffEfficiency: Array<{
    staffMember: string;
    ordersHandled: number;
    averagePrepTime: number;
    rating: number;
  }>;
}

// Mock data per i grafici (usando nomi di giorni localizzati)
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function KitchenPerformance() {
  const [timeRange, setTimeRange] = useState('week');
  const { t, i18n } = useTranslation();
  const [mockData, setMockData] = useState<KitchenPerformanceData | null>(null);
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);
  const currentLanguage = i18n.language as Language;
  
  // Funzione per forzare l'aggiornamento dell'interfaccia
  const forceUpdate = useCallback(() => {
    setForceUpdateCounter(prev => prev + 1);
  }, []);
  
  // Funzione per generare dati mock con traduzioni appropriate
  const generateMockData = useCallback(() => {
    console.log("Generating mock data with language:", currentLanguage);
    
    console.log("Translations for current language:", {
      weekdays: {
        mon: t('days.mon', 'Lun'),
        tue: t('days.tue', 'Mar'),
        wed: t('days.wed', 'Mer'),
        thu: t('days.thu', 'Gio'),
        fri: t('days.fri', 'Ven'),
        sat: t('days.sat', 'Sab'),
        sun: t('days.sun', 'Dom')
      },
      categories: {
        starters: t('menu.categories.starters', 'Antipasti'),
        mains: t('menu.categories.mains', 'Primi'),
        secondi: t('menu.categories.secondi', 'Secondi'),
        sides: t('menu.categories.sides', 'Contorni'),
        desserts: t('menu.categories.desserts', 'Dessert'),
        drinks: t('menu.categories.drinks', 'Bevande')
      },
      dishes: {
        risotto: t('dishes.risotto', 'Risotto ai funghi'),
        brasato: t('dishes.brasato', 'Brasato al barolo'),
        pizza: t('dishes.pizza', 'Pizza gourmet'),
        pizze: t('dishes.pizze', 'Pizze'),
        tiramisu: t('dishes.tiramisu', 'Tiramisù'),
        fiorentina: t('dishes.fiorentina', 'Fiorentina')
      }
    });
    
    const data: KitchenPerformanceData = {
      orderPrepTime: {
        averageTimeByDay: [
          { date: t('days.mon', 'Lun'), averageMinutes: 12 },
          { date: t('days.tue', 'Mar'), averageMinutes: 15 },
          { date: t('days.wed', 'Mer'), averageMinutes: 10 },
          { date: t('days.thu', 'Gio'), averageMinutes: 18 },
          { date: t('days.fri', 'Ven'), averageMinutes: 22 },
          { date: t('days.sat', 'Sab'), averageMinutes: 25 },
          { date: t('days.sun', 'Dom'), averageMinutes: 20 }
        ],
        averageTimeByCategory: [
          { category: t('menu.categories.starters', 'Antipasti'), averageMinutes: 8 },
          { category: t('menu.categories.mains', 'Primi'), averageMinutes: 15 },
          { category: t('menu.categories.secondi', 'Secondi'), averageMinutes: 20 },
          { category: t('menu.categories.sides', 'Contorni'), averageMinutes: 7 },
          { category: t('menu.categories.desserts', 'Dessert'), averageMinutes: 5 },
          { category: t('menu.categories.drinks', 'Bevande'), averageMinutes: 3 }
        ],
        busyHours: [
          { hour: 11, orderCount: 15, averageMinutes: 10 },
          { hour: 12, orderCount: 35, averageMinutes: 15 },
          { hour: 13, orderCount: 50, averageMinutes: 22 },
          { hour: 14, orderCount: 30, averageMinutes: 18 },
          { hour: 19, orderCount: 25, averageMinutes: 12 },
          { hour: 20, orderCount: 55, averageMinutes: 20 },
          { hour: 21, orderCount: 60, averageMinutes: 25 },
          { hour: 22, orderCount: 40, averageMinutes: 18 }
        ]
      },
      efficiency: {
        completedOrders: 435,
        totalOrders: 500,
        onTimePercentage: 87,
        latePercentage: 13
      },
      bottlenecks: [
        { item: t('dishes.risotto', 'Risotto ai funghi'), category: t('menu.categories.mains', 'Primi'), prepTime: 25, orderCount: 42 },
        { item: t('dishes.brasato', 'Brasato al barolo'), category: t('menu.categories.secondi', 'Secondi'), prepTime: 30, orderCount: 38 },
        { item: t('dishes.pizza', 'Pizza gourmet'), category: t('dishes.pizze', 'Pizze'), prepTime: 22, orderCount: 65 },
        { item: t('dishes.tiramisu', 'Tiramisù'), category: t('menu.categories.desserts', 'Dessert'), prepTime: 8, orderCount: 55 },
        { item: t('dishes.fiorentina', 'Fiorentina'), category: t('menu.categories.secondi', 'Secondi'), prepTime: 28, orderCount: 30 }
      ],
      staffEfficiency: [
        { staffMember: "Marco Rossi", ordersHandled: 120, averagePrepTime: 15, rating: 4.8 },
        { staffMember: "Giulia Bianchi", ordersHandled: 95, averagePrepTime: 17, rating: 4.5 },
        { staffMember: "Antonio Verdi", ordersHandled: 145, averagePrepTime: 12, rating: 4.9 },
        { staffMember: "Sofia Russo", ordersHandled: 85, averagePrepTime: 18, rating: 4.2 }
      ]
    };
    
    return data;
  }, [currentLanguage, t]);
  
  // Prepara i dati mock con traduzioni appropriate quando cambia la lingua
  useEffect(() => {
    console.log("Language changed to:", currentLanguage);
    
    // Aggiungiamo un ritardo per garantire che l'interfaccia i18n si aggiorni correttamente
    const timeoutId = setTimeout(() => {
      console.log("Forcing update for language:", currentLanguage);
      setMockData(generateMockData());
    }, 500); // Aumentiamo il delay a 500ms per dare più tempo al sistema i18n
    
    return () => clearTimeout(timeoutId);
  }, [currentLanguage, generateMockData, forceUpdateCounter]);
  
  // In un'applicazione reale, qui ci sarebbe una chiamata API per ottenere i dati
  // const { data, isLoading } = useQuery<KitchenPerformanceData>({
  //   queryKey: [`/api/admin/kitchen-performance?timeRange=${timeRange}`],
  // });
  
  // Per ora, usiamo i dati mock
  const data = mockData;
  const isLoading = !mockData;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  const titleKey = 'kitchenPerformance.title';
  const title = t(titleKey);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">{title}</h1>
          <div className="text-xs text-muted-foreground">
            Language: {currentLanguage} | Title key: {titleKey}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={forceUpdate}
            title="Force refresh translations"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <Select defaultValue={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('common.selectTimeRange')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">{t('kitchenPerformance.timeRanges.day')}</SelectItem>
              <SelectItem value="week">{t('kitchenPerformance.timeRanges.week')}</SelectItem>
              <SelectItem value="month">{t('kitchenPerformance.timeRanges.month')}</SelectItem>
              <SelectItem value="year">{t('kitchenPerformance.timeRanges.year')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">{t('kitchenPerformance.exportReport')}</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('kitchenPerformance.avgPrepTime')}</p>
                <h3 className="text-2xl font-bold mt-1">18 min</h3>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('kitchenPerformance.completedOrders')}</p>
                <h3 className="text-2xl font-bold mt-1">{data?.efficiency.completedOrders} / {data?.efficiency.totalOrders}</h3>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('kitchenPerformance.punctuality')}</p>
                <h3 className="text-2xl font-bold mt-1">{data?.efficiency.onTimePercentage}%</h3>
              </div>
              <Timer className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('kitchenPerformance.delays')}</p>
                <h3 className="text-2xl font-bold mt-1">{data?.efficiency.latePercentage}%</h3>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t('kitchenPerformance.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="details">{t('kitchenPerformance.tabs.details')}</TabsTrigger>
          <TabsTrigger value="staff">{t('kitchenPerformance.tabs.staff')}</TabsTrigger>
          <TabsTrigger value="bottlenecks">{t('kitchenPerformance.tabs.bottlenecks')}</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{t('kitchenPerformance.charts.prepTimeByDay.title')}</CardTitle>
                <CardDescription>
                  {t('kitchenPerformance.charts.prepTimeByDay.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={data?.orderPrepTime.averageTimeByDay}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis label={{ value: t('kitchenPerformance.charts.prepTimeByDay.yAxis'), angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value) => [`${value} min`, t('kitchenPerformance.charts.prepTimeByDay.legend')]} />
                      <Legend />
                      <Line type="monotone" dataKey="averageMinutes" name={t('kitchenPerformance.charts.prepTimeByDay.legend')} stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('kitchenPerformance.charts.prepTimeByCategory.title')}</CardTitle>
                <CardDescription>
                  {t('kitchenPerformance.charts.prepTimeByCategory.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data?.orderPrepTime.averageTimeByCategory}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis label={{ value: t('kitchenPerformance.charts.prepTimeByCategory.yAxis'), angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value) => [`${value} min`, t('kitchenPerformance.charts.prepTimeByCategory.legend')]} />
                      <Legend />
                      <Bar dataKey="averageMinutes" name={t('kitchenPerformance.charts.prepTimeByCategory.legend')} fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('kitchenPerformance.charts.efficiencyDistribution.title')}</CardTitle>
                <CardDescription>
                  {t('kitchenPerformance.charts.efficiencyDistribution.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: t('kitchenPerformance.charts.efficiencyDistribution.onTime'), value: data?.efficiency.onTimePercentage },
                          { name: t('kitchenPerformance.charts.efficiencyDistribution.delayed'), value: data?.efficiency.latePercentage }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: t('kitchenPerformance.charts.efficiencyDistribution.onTime'), value: data?.efficiency.onTimePercentage },
                          { name: t('kitchenPerformance.charts.efficiencyDistribution.delayed'), value: data?.efficiency.latePercentage }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, '']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('kitchenPerformance.charts.peakHours.title')}</CardTitle>
              <CardDescription>
                {t('kitchenPerformance.charts.peakHours.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data?.orderPrepTime.busyHours}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" label={{ value: t('common.hours'), position: 'insideBottom', offset: -5 }} />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" label={{ value: t('kitchenPerformance.charts.peakHours.orderCount'), angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" label={{ value: t('kitchenPerformance.charts.peakHours.avgPrepTime'), angle: 90, position: 'insideRight' }} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="orderCount" name={t('kitchenPerformance.charts.peakHours.orderCount')} fill="#8884d8" />
                    <Bar yAxisId="right" dataKey="averageMinutes" name={t('kitchenPerformance.charts.peakHours.avgPrepTime')} fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Staff Tab */}
        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('kitchenPerformance.charts.staffPerformance.title')}</CardTitle>
              <CardDescription>
                {t('kitchenPerformance.charts.staffPerformance.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-4 text-left">{t('kitchenPerformance.charts.staffPerformance.staffMember')}</th>
                      <th className="py-3 px-4 text-left">{t('kitchenPerformance.charts.staffPerformance.ordersHandled')}</th>
                      <th className="py-3 px-4 text-left">{t('kitchenPerformance.charts.staffPerformance.avgPrepTime')}</th>
                      <th className="py-3 px-4 text-left">{t('kitchenPerformance.charts.staffPerformance.rating')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.staffEfficiency.map((staff, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">{staff.staffMember}</td>
                        <td className="py-3 px-4">{staff.ordersHandled}</td>
                        <td className="py-3 px-4">{staff.averagePrepTime} min</td>
                        <td className="py-3 px-4">{staff.rating.toFixed(1)}/5.0</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Bottlenecks Tab */}
        <TabsContent value="bottlenecks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('kitchenPerformance.charts.bottlenecks.title')}</CardTitle>
              <CardDescription>
                {t('kitchenPerformance.charts.bottlenecks.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-4 text-left">{t('kitchenPerformance.charts.bottlenecks.item')}</th>
                      <th className="py-3 px-4 text-left">{t('kitchenPerformance.charts.bottlenecks.category')}</th>
                      <th className="py-3 px-4 text-left">{t('kitchenPerformance.charts.bottlenecks.prepTime')}</th>
                      <th className="py-3 px-4 text-left">{t('kitchenPerformance.charts.bottlenecks.orderCount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.bottlenecks.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">{item.item}</td>
                        <td className="py-3 px-4">{item.category}</td>
                        <td className="py-3 px-4">{item.prepTime} min</td>
                        <td className="py-3 px-4">{item.orderCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
} 