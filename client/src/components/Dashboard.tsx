
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Package, 
  Users, 
  AlertTriangle, 
  Activity,
  RefreshCw,
  TrendingUp,
  Calendar
} from 'lucide-react';
import type { DashboardSummary, Medication } from '../../../server/src/schema';

interface DashboardProps {
  dashboardData: DashboardSummary | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export function Dashboard({ dashboardData, isLoading, onRefresh }: DashboardProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">
          <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Gagal memuat data dashboard</p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              🏥 Selamat Datang di Dashboard Klinik
            </h2>
            <p className="text-blue-100">
              Pantau stok obat, data pasien, dan aktivitas klinik Anda
            </p>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            variant="secondary"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Medications */}
        <Card className="border-blue-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Obat
            </CardTitle>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Package className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {dashboardData.total_medications}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              💊 Jenis obat terdaftar
            </p>
          </CardContent>
        </Card>

        {/* Total Patients */}
        <Card className="border-green-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Pasien
            </CardTitle>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {dashboardData.total_patients}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              👥 Pasien terdaftar
            </p>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className="border-red-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Stok Rendah
            </CardTitle>
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {dashboardData.low_stock_medications}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              ⚠️ Obat perlu restok
            </p>
          </CardContent>
        </Card>

        {/* Recent Usages */}
        <Card className="border-orange-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Penggunaan (30 hari)
            </CardTitle>
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <Activity className="w-4 h-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">
              {dashboardData.recent_usages}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              📈 Aktivitas terakhir
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Items Alert */}
      {dashboardData.low_stock_items.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-amber-800">
              <AlertTriangle className="w-5 h-5" />
              <span>🚨 Peringatan Stok Rendah</span>
            </CardTitle>
            <CardDescription className="text-amber-700">
              Obat-obat berikut memiliki stok di bawah ambang batas dan perlu segera direstok
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.low_stock_items.map((medication: Medication) => (
                <div 
                  key={medication.id} 
                  className="bg-white p-4 rounded-lg border border-amber-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      {medication.nama_obat}
                    </h4>
                    <Badge variant="destructive" className="text-xs">
                      Rendah
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Jenis: {medication.jenis}
                  </p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-red-600 font-medium">
                      Stok: {medication.stok_tersedia}
                    </span>
                    <span className="text-gray-500">
                      Batas: {medication.ambang_batas}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span>🚀 Aksi Cepat</span>
          </CardTitle>
          <CardDescription>
            Akses fitur-fitur utama dengan cepat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2 hover:bg-blue-50 hover:border-blue-300"
            >
              <Package className="w-6 h-6 text-blue-600" />
              <span className="text-sm">Tambah Obat</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2 hover:bg-green-50 hover:border-green-300"
            >
              <Users className="w-6 h-6 text-green-600" />
              <span className="text-sm">Daftar Pasien</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2 hover:bg-orange-50 hover:border-orange-300"
            >
              <Calendar className="w-6 h-6 text-orange-600" />
              <span className="text-sm">Catat Penggunaan</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2 hover:bg-purple-50 hover:border-purple-300"
            >
              <Activity className="w-6 h-6 text-purple-600" />
              <span className="text-sm">Lihat Laporan</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">
                🟢 Sistem berjalan normal
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Terakhir diperbarui: {new Date().toLocaleString('id-ID')}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome Section Skeleton */}
      <Skeleton className="h-32 w-full rounded-lg" />
      
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
          </Card>
        ))}
      </div>
      
      {/* Additional Content Skeleton */}
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}
