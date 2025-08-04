
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  TrendingUp,
  Calendar,
  Users,
  Package,
  BarChart3,
  PieChart,
  Activity,
  Filter
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { ReportFilter, UsageReport, PatientReport, Medication } from '../../../server/src/schema';

export function Reports() {
  const [usageReport, setUsageReport] = useState<UsageReport[]>([]);
  const [patientReport, setPatientReport] = useState<PatientReport | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('usage');

  // Filter state
  const [filters, setFilters] = useState<ReportFilter>({
    start_date: undefined,
    end_date: undefined,
    medication_id: undefined
  });

  // Load data
  const loadReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const [usageResult, patientResult, medicationsResult] = await Promise.all([
        trpc.getUsageReport.query(filters),
        trpc.getPatientReport.query(filters),
        trpc.getMedications.query()
      ]);
      setUsageReport(usageResult);
      setPatientReport(patientResult);
      setMedications(medicationsResult);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Handle filter change
  const handleFilterChange = (key: keyof ReportFilter, value: Date | number | undefined) => {
    setFilters((prev: ReportFilter) => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      start_date: undefined,
      end_date: undefined,
      medication_id: undefined
    });
  };

  // Export functions with real implementation stubs
  const handleExportPDF = (reportType: string) => {
    console.log(`Exporting ${reportType} to PDF...`);
    // Integration with PDF generation library like jsPDF or react-pdf would be implemented here
    alert(`📄 Export to PDF functionality will be implemented with a PDF generation library`);
  };

  const handleExportExcel = (reportType: string) => {
    console.log(`Exporting ${reportType} to Excel...`);
    // Integration with Excel export library like xlsx or exceljs would be implemented here
    alert(`📊 Export to Excel functionality will be implemented with an Excel export library`);
  };

  if (isLoading) {
    return <ReportsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            <span>📊 Laporan & Analisis</span>
          </h2>
          <p className="text-gray-600 mt-1">
            Analisis data penggunaan obat, pasien, dan tren klinik
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span>🔍 Filter Laporan</span>
          </CardTitle>
          <CardDescription>
            Atur rentang tanggal dan filter lainnya untuk melihat laporan yang spesifik
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Tanggal Mulai</Label>
              <Input
                id="start_date"
                type="date"
                value={filters.start_date 
                  ? (filters.start_date instanceof Date 
                      ? filters.start_date.toISOString().split('T')[0]
                      : filters.start_date)
                  : ''
                }
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleFilterChange('start_date', e.target.value ? new Date(e.target.value) : undefined)
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end_date">Tanggal Akhir</Label>
              <Input
                id="end_date"
                type="date"
                value={filters.end_date 
                  ? (filters.end_date instanceof Date 
                      ? filters.end_date.toISOString().split('T')[0]
                      : filters.end_date)
                  : ''
                }
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleFilterChange('end_date', e.target.value ? new Date(e.target.value) : undefined)
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="medication_id">Filter Obat</Label>
              <Select
                value={filters.medication_id?.toString() || 'all'}
                onValueChange={(value: string) =>
                  handleFilterChange('medication_id', value === 'all' ? undefined : parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua obat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua obat</SelectItem>
                  {medications.map((medication: Medication) => (
                    <SelectItem 
                      key={medication.id} 
                      value={medication.id.toString()}
                    >
                      {medication.nama_obat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <div className="flex space-x-2">
                <Button onClick={loadReports} variant="default" size="sm">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Tampilkan
                </Button>
                <Button onClick={resetFilters} variant="outline" size="sm">
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-fit">
          <TabsTrigger 
            value="usage"
            className="flex items-center space-x-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
          >
            <Activity className="w-4 h-4" />
            <span>Penggunaan Obat</span>
          </TabsTrigger>
          <TabsTrigger 
            value="patients"
            className="flex items-center space-x-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white"
          >
            <Users className="w-4 h-4" />
            <span>Data Pasien</span>
          </TabsTrigger>
        </TabsList>

        {/* Usage Report Tab */}
        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Usage Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    <span>Statistik Penggunaan</span>
                  </span>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => handleExportPDF('usage')}
                      variant="outline" 
                      size="sm"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      PDF
                    </Button>
                    <Button 
                      onClick={() => handleExportExcel('usage')}
                      variant="outline" 
                      size="sm"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Excel
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {usageReport.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">
                      Tidak ada data penggunaan untuk filter yang dipilih
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {usageReport.map((report: UsageReport, index: number) => (
                      <div key={index} className="border rounded-lg p-4 bg-gradient-to-r from-indigo-50 to-blue-50">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{report.medication_name}</h4>
                          <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                            {report.usage_count} kali pakai
                          </Badge>
                        </div>
                        <div className="text-2xl font-bold text-indigo-700 mb-1">
                          {report.total_used} unit
                        </div>
                        <p className="text-xs text-gray-600">
                          Periode: {report.date_range.start.toLocaleDateString('id-ID')} - {report.date_range.end.toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Usage Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="w-5 h-5 text-indigo-600" />
                  <span>Grafik Penggunaan</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <PieChart className="w-12 h-12 text-indigo-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium mb-2">📊 Grafik Visual</p>
                    <p className="text-sm text-gray-500 max-w-xs">
                      Integrasi dengan library charting (Chart.js, Recharts, dll) 
                      akan menampilkan grafik interaktif di sini
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Patient Report Tab */}
        <TabsContent value="patients" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Patient Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span>Statistik Pasien</span>
                  </span>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => handleExportPDF('patients')}
                      variant="outline" 
                      size="sm"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      PDF
                    </Button>
                    <Button 
                      onClick={() => handleExportExcel('patients')}
                      variant="outline" 
                      size="sm"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Excel
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!patientReport ? (
                  <div className="text-center py-8">
                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">
                      Tidak ada data pasien untuk filter yang dipilih
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Total Patients */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                      <div className="text-3xl font-bold text-purple-700 mb-1">
                        {patientReport.total_patients}
                      </div>
                      <p className="text-sm text-gray-600">👥 Total Pasien Terdaftar</p>
                    </div>

                    {/* Gender Distribution */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Distribusi Jenis Kelamin</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <span className="flex items-center space-x-2">
                            <span>👦</span>
                            <span>Laki-laki</span>
                          </span>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {patientReport.patients_by_gender['Laki-laki']} orang
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                          <span className="flex items-center space-x-2">
                            <span>👧</span>
                            <span>Perempuan</span>
                          </span>
                          <Badge variant="secondary" className="bg-pink-100 text-pink-800">
                            {patientReport.patients_by_gender['Perempuan']} orang
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Monthly Distribution */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Pasien per Bulan</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {patientReport.patients_by_month.map((monthData: { month: string; count: number }, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-600" />
                              <span>{monthData.month}</span>
                            </span>
                            <Badge variant="outline">
                              {monthData.count} pasien
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Patient Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <span>Grafik Pasien</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium mb-2">📈 Grafik Tren</p>
                    <p className="text-sm text-gray-500 max-w-xs">
                      Grafik tren pasien per bulan dan distribusi demografis 
                      akan ditampilkan di sini
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Obat</p>
                <p className="text-2xl font-bold">{medications.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Stok Tersedia</p>
                <p className="text-2xl font-bold">
                  {medications.reduce((sum, m) => sum + m.stok_tersedia, 0)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Pasien</p>
                <p className="text-2xl font-bold">{patientReport?.total_patients || 0}</p>
              </div>
              <Users className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Total Penggunaan</p>
                <p className="text-2xl font-bold">
                  {usageReport.reduce((sum, r) => sum + r.total_used, 0)}
                </p>
              </div>
              <Activity className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>
      
      {/* Filters Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs Skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
}
