
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2,
  AlertTriangle,
  CheckCircle,
  Pill
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Medication, CreateMedicationInput, UpdateMedicationInput } from '../../../server/src/schema';

interface MedicationManagementProps {
  onDataChange: () => void;
}

export function MedicationManagement({ onDataChange }: MedicationManagementProps) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateMedicationInput>({
    nama_obat: '',
    jenis: '',
    stok_tersedia: 0,
    ambang_batas: 0
  });

  // Load medications
  const loadMedications = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getMedications.query();
      setMedications(result);
    } catch (error) {
      console.error('Failed to load medications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search medications
  const searchMedications = useCallback(async (term: string) => {
    if (!term.trim()) {
      loadMedications();
      return;
    }
    try {
      const result = await trpc.searchMedications.query(term);
      setMedications(result);
    } catch (error) {
      console.error('Failed to search medications:', error);
    }
  }, [loadMedications]);

  useEffect(() => {
    loadMedications();
  }, [loadMedications]);

  // Handle search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchMedications(searchTerm);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, searchMedications]);

  // Reset form
  const resetForm = () => {
    setFormData({
      nama_obat: '',
      jenis: '',
      stok_tersedia: 0,
      ambang_batas: 0
    });
    setEditingMedication(null);
  };

  // Handle create/update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingMedication) {
        // Update medication
        const updateData: UpdateMedicationInput = {
          id: editingMedication.id,
          ...formData
        };
        await trpc.updateMedication.mutate(updateData);
      } else {
        // Create medication
        await trpc.createMedication.mutate(formData);
      }

      resetForm();
      setIsCreateDialogOpen(false);
      await loadMedications();
      onDataChange(); // Refresh dashboard
    } catch (error) {
      console.error('Failed to save medication:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteMedication.mutate(id);
      await loadMedications();
      onDataChange(); // Refresh dashboard
    } catch (error) {
      console.error('Failed to delete medication:', error);
    }
  };

  // Handle edit
  const handleEdit = (medication: Medication) => {
    setFormData({
      nama_obat: medication.nama_obat,
      jenis: medication.jenis,
      stok_tersedia: medication.stok_tersedia,
      ambang_batas: medication.ambang_batas
    });
    setEditingMedication(medication);
    setIsCreateDialogOpen(true);
  };

  // Get stock status
  const getStockStatus = (medication: Medication) => {
    if (medication.stok_tersedia <= medication.ambang_batas) {
      return { status: 'low', color: 'destructive' as const, icon: AlertTriangle };
    }
    return { status: 'good', color: 'default' as const, icon: CheckCircle };
  };

  if (isLoading) {
    return <MedicationSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Package className="w-6 h-6 text-blue-600" />
            <span>💊 Manajemen Obat</span>
          </h2>
          <p className="text-gray-600 mt-1">
            Kelola stok obat dan pantau ketersediaan
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                resetForm();
                setIsCreateDialogOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Obat
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Pill className="w-5 h-5 text-blue-600" />
                <span>{editingMedication ? 'Edit Obat' : 'Tambah Obat Baru'}</span>
              </DialogTitle>
              <DialogDescription>
                {editingMedication 
                  ? 'Perbarui informasi obat yang sudah ada'
                  : 'Tambahkan obat baru ke dalam sistem'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama_obat">Nama Obat *</Label>
                <Input
                  id="nama_obat"
                  value={formData.nama_obat}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateMedicationInput) => ({ 
                      ...prev, 
                      nama_obat: e.target.value 
                    }))
                  }
                  placeholder="Contoh: Betadine, Paracetamol"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="jenis">Jenis Obat *</Label>
                <Input
                  id="jenis"
                  value={formData.jenis}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateMedicationInput) => ({ 
                      ...prev, 
                      jenis: e.target.value 
                    }))
                  }
                  placeholder="Contoh: Antiseptik, Analgesik"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stok_tersedia">Stok Tersedia *</Label>
                  <Input
                    id="stok_tersedia"
                    type="number"
                    value={formData.stok_tersedia}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateMedicationInput) => ({ 
                        ...prev, 
                        stok_tersedia: parseInt(e.target.value) || 0
                      }))
                    }
                    min="0"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ambang_batas">Ambang Batas *</Label>
                  <Input
                    id="ambang_batas"
                    type="number"
                    value={formData.ambang_batas}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateMedicationInput) => ({ 
                        ...prev, 
                        ambang_batas: parseInt(e.target.value) || 0
                      }))
                    }
                    
                    min="0"
                    required
                  />
                </div>
              </div>
              
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
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? 'Menyimpan...' : editingMedication ? 'Perbarui' : 'Simpan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-600" />
            <Label htmlFor="search">🔍 Cari Obat</Label>
          </div>
        </CardHeader>
        <CardContent>
          <Input
            id="search"
            placeholder="Cari berdasarkan nama obat atau jenis..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Medications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Daftar Obat ({medications.length})</span>
            </span>
            {medications.filter(m => m.stok_tersedia <= m.ambang_batas).length > 0 && (
              <Badge variant="destructive" className="flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>{medications.filter(m => m.stok_tersedia <= m.ambang_batas).length} Stok Rendah</span>
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {medications.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Belum ada obat terdaftar</p>
              <p className="text-sm text-gray-400">
                {searchTerm ? 'Tidak ada obat yang sesuai dengan pencarian' : 'Tambahkan obat pertama Anda'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Obat</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead>Ambang Batas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal Dibuat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medications.map((medication: Medication) => {
                    const stockStatus = getStockStatus(medication);
                    const StatusIcon = stockStatus.icon;
                    
                    return (
                      <TableRow key={medication.id}>
                        <TableCell className="font-medium">
                          {medication.nama_obat}
                        </TableCell>
                        <TableCell>{medication.jenis}</TableCell>
                        <TableCell>
                          <span className={`font-medium ${
                            medication.stok_tersedia <= medication.ambang_batas 
                              ? 'text-red-600' 
                              : 'text-green-600'
                          }`}>
                            {medication.stok_tersedia}
                          </span>
                        </TableCell>
                        <TableCell>{medication.ambang_batas}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={stockStatus.color}
                            className="flex items-center space-x-1 w-fit"
                          >
                            <StatusIcon className="w-3 h-3" />
                            <span>
                              {stockStatus.status === 'low' ? 'Rendah' : 'Baik'}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {medication.created_at.toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(medication)}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus Obat</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Apakah Anda yakin ingin menghapus obat "{medication.nama_obat}"? 
                                    Tindakan ini tidak dapat dibatalkan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(medication.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Hapus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
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

function MedicationSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Search Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full max-w-md" />
        </CardContent>
      </Card>
      
      {/* Table Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
