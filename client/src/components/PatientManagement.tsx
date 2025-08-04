
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2,
  Calendar,
  Phone,
  MapPin,
  User,
  FileText
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Patient, CreatePatientInput, UpdatePatientInput } from '../../../server/src/schema';

interface PatientManagementProps {
  onDataChange: () => void;
}

export function PatientManagement({ onDataChange }: PatientManagementProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreatePatientInput>({
    nama: '',
    umur: 0,
    jenis_kelamin: 'Laki-laki',
    alamat: '',
    kontak: '',
    tanggal_tindakan: new Date(),
    catatan: null
  });

  // Load patients
  const loadPatients = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getPatients.query();
      setPatients(result);
    } catch (error) {
      console.error('Failed to load patients:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search patients
  const searchPatients = useCallback(async (term: string) => {
    if (!term.trim()) {
      loadPatients();
      return;
    }
    try {
      const result = await trpc.searchPatients.query(term);
      setPatients(result);
    } catch (error) {
      console.error('Failed to search patients:', error);
    }
  }, [loadPatients]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Handle search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchPatients(searchTerm);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, searchPatients]);

  // Reset form
  const resetForm = () => {
    setFormData({
      nama: '',
      umur: 0,
      jenis_kelamin: 'Laki-laki',
      alamat: '',
      kontak: '',
      tanggal_tindakan: new Date(),
      catatan: null
    });
    setEditingPatient(null);
  };

  // Handle create/update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingPatient) {
        // Update patient
        const updateData: UpdatePatientInput = {
          id: editingPatient.id,
          ...formData
        };
        await trpc.updatePatient.mutate(updateData);
      } else {
        // Create patient
        await trpc.createPatient.mutate(formData);
      }

      resetForm();
      setIsCreateDialogOpen(false);
      await loadPatients();
      onDataChange(); // Refresh dashboard
    } catch (error) {
      console.error('Failed to save patient:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    try {
      await trpc.deletePatient.mutate(id);
      await loadPatients();
      onDataChange(); // Refresh dashboard
    } catch (error) {
      console.error('Failed to delete patient:', error);
    }
  };

  // Handle edit
  const handleEdit = (patient: Patient) => {
    setFormData({
      nama: patient.nama,
      umur: patient.umur,
      jenis_kelamin: patient.jenis_kelamin,
      alamat: patient.alamat,
      kontak: patient.kontak,
      tanggal_tindakan: patient.tanggal_tindakan,
      catatan: patient.catatan
    });
    setEditingPatient(patient);
    setIsCreateDialogOpen(true);
  };

  // Get age group badge
  const getAgeGroupBadge = (age: number) => {
    if (age < 5) return { label: 'Balita', color: 'bg-purple-100 text-purple-800' };
    if (age < 13) return { label: 'Anak', color: 'bg-blue-100 text-blue-800' };
    if (age < 18) return { label: 'Remaja', color: 'bg-green-100 text-green-800' };
    return { label: 'Dewasa', color: 'bg-gray-100 text-gray-800' };
  };

  if (isLoading) {
    return <PatientSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Users className="w-6 h-6 text-purple-600" />
            <span>👥 Manajemen Pasien</span>
          </h2>
          <p className="text-gray-600 mt-1">
            Kelola data pasien dan riwayat tindakan
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                resetForm();
                setIsCreateDialogOpen(true);
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Pasien
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <User className="w-5 h-5 text-purple-600" />
                <span>{editingPatient ? 'Edit Pasien' : 'Tambah Pasien Baru'}</span>
              </DialogTitle>
              <DialogDescription>
                {editingPatient 
                  ? 'Perbarui informasi pasien yang sudah ada'
                  : 'Tambahkan pasien baru ke dalam sistem'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap *</Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePatientInput) => ({ 
                      ...prev, 
                      nama: e.target.value 
                    }))
                  }
                  placeholder="Masukkan nama lengkap pasien"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="umur">Umur *</Label>
                  <Input
                    id="umur"
                    type="number"
                    value={formData.umur}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreatePatientInput) => ({ 
                        ...prev, 
                        umur: parseInt(e.target.value) || 0
                      }))
                    }
                    min="1"
                    max="100"
                    placeholder="Tahun"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="jenis_kelamin">Jenis Kelamin *</Label>
                  <Select
                    value={formData.jenis_kelamin}
                    onValueChange={(value: 'Laki-laki' | 'Perempuan') =>
                      setFormData((prev: CreatePatientInput) => ({ 
                        ...prev, 
                        jenis_kelamin: value 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                      <SelectItem value="Perempuan">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="alamat">Alamat *</Label>
                <Textarea
                  id="alamat"
                  value={formData.alamat}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreatePatientInput) => ({ 
                      ...prev, 
                      alamat: e.target.value 
                    }))
                  }
                  placeholder="Masukkan alamat lengkap"
                  rows={2}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="kontak">Nomor Kontak *</Label>
                <Input
                  id="kontak"
                  value={formData.kontak}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePatientInput) => ({ 
                      ...prev, 
                      kontak: e.target.value 
                    }))
                  }
                  placeholder="Contoh: 081234567890"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tanggal_tindakan">Tanggal Tindakan *</Label>
                <Input
                  id="tanggal_tindakan"
                  type="date"
                  value={formData.tanggal_tindakan instanceof Date 
                    ? formData.tanggal_tindakan.toISOString().split('T')[0]
                    : formData.tanggal_tindakan
                  }
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePatientInput) => ({ 
                      ...prev, 
                      tanggal_tindakan: new Date(e.target.value)
                    }))
                  }
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="catatan">Catatan (Opsional)</Label>
                <Textarea
                  id="catatan"
                  value={formData.catatan || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreatePatientInput) => ({ 
                      ...prev, 
                      catatan: e.target.value || null
                    }))
                  }
                  placeholder="Catatan tambahan tentang kondisi atau instruksi khusus"
                  rows={3}
                />
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
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isSubmitting ? 'Menyimpan...' : editingPatient ? 'Perbarui' : 'Simpan'}
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
            <Label htmlFor="search">🔍 Cari Pasien</Label>
          </div>
        </CardHeader>
        <CardContent>
          <Input
            id="search"
            placeholder="Cari berdasarkan nama, kontak, atau alamat..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Patients List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Daftar Pasien ({patients.length})</span>
            </span>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Laki-laki: {patients.filter(p => p.jenis_kelamin === 'Laki-laki').length}
              </Badge>
              <Badge variant="outline" className="bg-pink-50 text-pink-700">
                Perempuan: {patients.filter(p => p.jenis_kelamin === 'Perempuan').length}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Belum ada pasien terdaftar</p>
              <p className="text-sm text-gray-400">
                {searchTerm ? 'Tidak ada pasien yang sesuai dengan pencarian' : 'Tambahkan pasien pertama Anda'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Umur</TableHead>
                    <TableHead>Jenis Kelamin</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead>Tanggal Tindakan</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient: Patient) => {
                    const ageGroup = getAgeGroupBadge(patient.umur);
                    
                    return (
                      <TableRow key={patient.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{patient.nama}</div>
                            {patient.catatan && (
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <FileText className="w-3 h-3" />
                                <span className="truncate max-w-32">{patient.catatan}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1">
                            <span className="font-medium">{patient.umur} tahun</span>
                            <Badge 
                              className={`text-xs w-fit ${ageGroup.color}`}
                              variant="secondary"
                            >
                              {ageGroup.label}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              patient.jenis_kelamin === 'Laki-laki' 
                                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                : 'bg-pink-50 text-pink-700 border-pink-200'
                            }
                          >
                            {patient.jenis_kelamin === 'Laki-laki' ? '👦' : '👧'} {patient.jenis_kelamin}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{patient.kontak}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">
                              {patient.tanggal_tindakan.toLocaleDateString('id-ID')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start space-x-1 max-w-48">
                            <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-600 line-clamp-2">
                              {patient.alamat}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(patient)}
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
                                  <AlertDialogTitle>Hapus Pasien</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Apakah Anda yakin ingin menghapus pasien "{patient.nama}"? 
                                    Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(patient.id)}
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

function PatientSkeleton() {
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
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
                
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
