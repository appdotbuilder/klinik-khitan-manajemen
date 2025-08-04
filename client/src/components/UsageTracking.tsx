
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Plus, 
  Package, 
  AlertTriangle,
  CheckCircle,
  FileText,
  Activity,
  Pill
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Usage, Medication, CreateUsageInput } from '../../../server/src/schema';

interface UsageTrackingProps {
  onDataChange: () => void;
}

export function UsageTracking({ onDataChange }: UsageTrackingProps) {
  const [usages, setUsages] = useState<Usage[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateUsageInput>({
    id_obat: 0,
    tanggal: new Date(),
    jumlah_dipakai: 0,
    catatan: null
  });

  // Load data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [usageResult, medicationResult] = await Promise.all([
        trpc.getUsages.query(),
        trpc.getMedications.query()
      ]);
      setUsages(usageResult);
      setMedications(medicationResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset form
  const resetForm = () => {
    setFormData({
      id_obat: 0,
      tanggal: new Date(),
      jumlah_dipakai: 0,
      catatan: null
    });
  };

  // Handle create usage
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await trpc.createUsage.mutate(formData);
      resetForm();
      setIsCreateDialogOpen(false);
      await loadData();
      onDataChange(); // Refresh dashboard
    } catch (error) {
      console.error('Failed to create usage:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get medication name by id
  const getMedicationName = (id: number) => {
    const medication = medications.find(m => m.id === id);
    return medication ? medication.nama_obat : 'Obat tidak ditemukan';
  };

  // Get medication stock status
  const getMedicationStockStatus = (id: number) => {
    const medication = medications.find(m => m.id === id);
    if (!medication) return null;
    
    const isLowStock = medication.stok_tersedia <= medication.ambang_batas;
    return {
      isLow: isLowStock,
      current: medication.stok_tersedia,
      threshold: medication.ambang_batas
    };
  };

  // Get available medications for form
  const availableMedications = medications.filter(m => m.stok_tersedia > 0);

  if (isLoading) {
    return <UsageTrackingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-orange-600" />
            <span>📊 Tracking Penggunaan Obat</span>
          </h2>
          <p className="text-gray-600 mt-1">
            Catat penggunaan obat dan pantau penurunan stok otomatis
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                resetForm();
                setIsCreateDialogOpen(true);
              }}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={availableMedications.length === 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              Catat Penggunaan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-orange-600" />
                <span>Catat Penggunaan Obat</span>
              </DialogTitle>
              <DialogDescription>
                Catat penggunaan obat untuk pasien. Stok akan dikurangi otomatis.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="id_obat">Pilih Obat *</Label>
                <Select
                  value={formData.id_obat.toString()}
                  onValueChange={(value: string) =>
                    setFormData((prev: CreateUsageInput) => ({ 
                      ...prev, 
                      id_obat: parseInt(value)
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih obat yang akan digunakan" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMedications.length === 0 ? (
                      <div className="p-2 text-center text-gray-500">
                        Tidak ada obat dengan stok tersedia
                      </div>
                    ) : (
                      availableMedications.map((medication: Medication) => {
                        const stockStatus = getMedicationStockStatus(medication.id);
                        return (
                          <SelectItem 
                            key={medication.id} 
                            value={medication.id.toString()}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div>
                                <span>{medication.nama_obat}</span>
                                <span className="text-xs text-gray-500 ml-2">
                                  ({medication.jenis})
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`text-xs ${
                                  stockStatus?.isLow ? 'text-red-600' : 'text-green-600'
                                } font-medium`}>
                                  Stok: {medication.stok_tersedia}
                                </span>
                                {stockStatus?.isLow && (
                                  <AlertTriangle className="w-3 h-3 text-red-500" />
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tanggal">Tanggal Penggunaan *</Label>
                <Input
                  id="tanggal"
                  type="date"
                  value={formData.tanggal instanceof Date 
                    ? formData.tanggal.toISOString().split('T')[0]
                    : formData.tanggal
                  }
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateUsageInput) => ({ 
                      ...prev, 
                      tanggal: new Date(e.target.value)
                    }))
                  }
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="jumlah_dipakai">Jumlah Digunakan *</Label>
                <Input
                  id="jumlah_dipakai"
                  type="number"
                  value={formData.jumlah_dipakai}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateUsageInput) => ({ 
                      ...prev, 
                      jumlah_dipakai: parseInt(e.target.value) || 0
                    }))
                  }
                  min="1"
                  required
                />
                {formData.id_obat > 0 && (
                  <p className="text-xs text-gray-600">
                    Stok tersedia: {medications.find(m => m.id === formData.id_obat)?.stok_tersedia || 0}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="catatan">Catatan (Opsional)</Label>
                <Textarea
                  id="catatan"
                  value={formData.catatan || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateUsageInput) => ({ 
                      ...prev, 
                      catatan: e.target.value || null
                    }))
                  }
                  placeholder="Catatan tentang penggunaan obat, pasien, atau kondisi khusus"
                  rows={3}
                />
              </div>
              
              {formData.id_obat > 0 && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Package className="w-4 h-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Info:</strong> Stok obat akan dikurangi otomatis sebanyak {formData.jumlah_dipakai} setelah pencatatan.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || formData.id_obat === 0}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Catat Penggunaan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Total Penggunaan</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{usages.length}</div>
            <p className="text-xs text-gray-600 mt-1">📈 Catatan penggunaan</p>
          </CardContent>
        </Card>
        
        <Card className="border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center space-x-2">
             <Package className="w-4 h-4 text-green-600" />
              <span>Obat Tersedia</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{availableMedications.length}</div>
            <p className="text-xs text-gray-600 mt-1">💊 Siap digunakan</p>
          </CardContent>
        </Card>
        
        <Card className="border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Perlu Perhatian</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">
              {medications.filter(m => m.stok_tersedia <= m.ambang_batas).length}
            </div>
            <p className="text-xs text-gray-600 mt-1">⚠️ Stok rendah</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Warning */}
      {medications.filter(m => m.stok_tersedia <= m.ambang_batas).length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>⚠️ Peringatan:</strong> Ada {medications.filter(m => m.stok_tersedia <= m.ambang_batas).length} obat dengan stok rendah. 
            Pastikan untuk melakukan restok sebelum kehabisan.
          </AlertDescription>
        </Alert>
      )}

      {/* Usage History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Riwayat Penggunaan Obat ({usages.length})</span>
          </CardTitle>
          <CardDescription>
            Catatan lengkap penggunaan obat dengan pengurangan stok otomatis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usages.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Belum ada catatan penggunaan obat</p>
              <p className="text-sm text-gray-400">
                Mulai catat penggunaan obat untuk melacak stok dan penggunaan
              </p>
              {availableMedications.length === 0 && (
                <div className="mt-4">
                  <Alert className="border-red-200 bg-red-50 max-w-md mx-auto">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      Tidak ada obat dengan stok tersedia. Tambahkan obat terlebih dahulu.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Obat</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Jumlah Digunakan</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead>Status Stok</TableHead>
                    <TableHead>Dicatat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usages
                    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
                    .map((usage: Usage) => {
                      const stockStatus = getMedicationStockStatus(usage.id_obat);
                      
                      return (
                        <TableRow key={usage.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Pill className="w-4 h-4 text-blue-600" />
                              <span className="font-medium">
                                {getMedicationName(usage.id_obat)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className="text-sm">
                                {usage.tanggal.toLocaleDateString('id-ID')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-orange-50 text-orange-700">
                              {usage.jumlah_dipakai} unit
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {usage.catatan ? (
                              <div className="flex items-start space-x-1 max-w-48">
                                <FileText className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-600 line-clamp-2">
                                  {usage.catatan}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {stockStatus ? (
                              <Badge 
                                variant={stockStatus.isLow ? "destructive" : "default"}
                                className="flex items-center space-x-1 w-fit"
                              >
                                {stockStatus.isLow ? (
                                  <AlertTriangle className="w-3 h-3" />
                                ) : (
                                  <CheckCircle className="w-3 h-3" />
                                )}
                                <span>
                                  {stockStatus.current} / {stockStatus.threshold}
                                </span>
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                Obat dihapus
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {usage.created_at.toLocaleDateString('id-ID')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UsageTrackingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      
      {/* Info Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Table Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
