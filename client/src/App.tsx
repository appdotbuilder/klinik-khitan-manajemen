
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  Users, 
  AlertTriangle, 
  Activity,
  FileText,
  Calendar,
  Pill
} from 'lucide-react';

// Import custom components
import { Dashboard } from '@/components/Dashboard';
import { MedicationManagement } from '@/components/MedicationManagement';
import { PatientManagement } from '@/components/PatientManagement';
import { UsageTracking } from '@/components/UsageTracking';
import { Reports } from '@/components/Reports';

// Import types
import type { 
  Medication, 
  DashboardSummary 
} from '../../server/src/schema';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load dashboard data
  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await trpc.getDashboardSummary.query();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                <Pill className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  🏥 Klinik Khitan Management
                </h1>
                <p className="text-sm text-gray-600">
                  Sistem Manajemen Obat & Pasien
                </p>
              </div>
            </div>
            
            {/* Quick Stats in Header */}
            {dashboardData && (
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-full">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    {dashboardData.total_medications} Obat
                  </span>
                </div>
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 rounded-full">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    {dashboardData.total_patients} Pasien
                  </span>
                </div>
                {dashboardData.low_stock_medications > 0 && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-red-50 rounded-full">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-700">
                      {dashboardData.low_stock_medications} Stok Rendah
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Low Stock Alert */}
      {dashboardData && dashboardData.low_stock_items.length > 0 && (
        <div className="container mx-auto px-4 py-2">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>⚠️ Peringatan Stok Rendah:</strong>{' '}
              {dashboardData.low_stock_items.map((item: Medication) => item.nama_obat).join(', ')}{' '}
              memiliki stok di bawah ambang batas.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Navigation Tabs */}
          <TabsList className="grid w-full grid-cols-5 lg:w-fit lg:grid-cols-5 bg-white shadow-sm">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center space-x-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger 
              value="medications"
              className="flex items-center space-x-2 data-[state=active]:bg-green-500 data-[state=active]:text-white"
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Obat</span>
            </TabsTrigger>
            <TabsTrigger 
              value="patients"
              className="flex items-center space-x-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Pasien</span>
            </TabsTrigger>
            <TabsTrigger 
              value="usage"
              className="flex items-center space-x-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Penggunaan</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reports"
              className="flex items-center space-x-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Laporan</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard 
              dashboardData={dashboardData} 
              isLoading={isLoading}
              onRefresh={loadDashboard}
            />
          </TabsContent>

          <TabsContent value="medications" className="space-y-6">
            <MedicationManagement onDataChange={loadDashboard} />
          </TabsContent>

          <TabsContent value="patients" className="space-y-6">
            <PatientManagement onDataChange={loadDashboard} />
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <UsageTracking onDataChange={loadDashboard} />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Reports />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>© 2024 Klinik Khitan Management System</p>
            <p className="mt-1">Sistem manajemen terintegrasi untuk klinik khitan</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
