
import { z } from 'zod';

// Medication schema
export const medicationSchema = z.object({
  id: z.number(),
  nama_obat: z.string(),
  jenis: z.string(),
  stok_tersedia: z.number().int().nonnegative(),
  ambang_batas: z.number().int().nonnegative(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Medication = z.infer<typeof medicationSchema>;

// Input schema for creating medications
export const createMedicationInputSchema = z.object({
  nama_obat: z.string().min(1, "Nama obat tidak boleh kosong"),
  jenis: z.string().min(1, "Jenis obat tidak boleh kosong"),
  stok_tersedia: z.number().int().nonnegative(),
  ambang_batas: z.number().int().nonnegative()
});

export type CreateMedicationInput = z.infer<typeof createMedicationInputSchema>;

// Input schema for updating medications
export const updateMedicationInputSchema = z.object({
  id: z.number(),
  nama_obat: z.string().min(1).optional(),
  jenis: z.string().min(1).optional(),
  stok_tersedia: z.number().int().nonnegative().optional(),
  ambang_batas: z.number().int().nonnegative().optional()
});

export type UpdateMedicationInput = z.infer<typeof updateMedicationInputSchema>;

// Usage schema
export const usageSchema = z.object({
  id: z.number(),
  id_obat: z.number(),
  tanggal: z.coerce.date(),
  jumlah_dipakai: z.number().int().positive(),
  catatan: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Usage = z.infer<typeof usageSchema>;

// Input schema for creating usage records
export const createUsageInputSchema = z.object({
  id_obat: z.number(),
  tanggal: z.coerce.date(),
  jumlah_dipakai: z.number().int().positive(),
  catatan: z.string().nullable()
});

export type CreateUsageInput = z.infer<typeof createUsageInputSchema>;

// Patient schema
export const patientSchema = z.object({
  id: z.number(),
  nama: z.string(),
  umur: z.number().int().positive(),
  jenis_kelamin: z.enum(['Laki-laki', 'Perempuan']),
  alamat: z.string(),
  kontak: z.string(),
  tanggal_tindakan: z.coerce.date(),
  catatan: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Patient = z.infer<typeof patientSchema>;

// Input schema for creating patients
export const createPatientInputSchema = z.object({
  nama: z.string().min(1, "Nama tidak boleh kosong"),
  umur: z.number().int().positive(),
  jenis_kelamin: z.enum(['Laki-laki', 'Perempuan']),
  alamat: z.string().min(1, "Alamat tidak boleh kosong"),
  kontak: z.string().min(1, "Kontak tidak boleh kosong"),
  tanggal_tindakan: z.coerce.date(),
  catatan: z.string().nullable()
});

export type CreatePatientInput = z.infer<typeof createPatientInputSchema>;

// Input schema for updating patients
export const updatePatientInputSchema = z.object({
  id: z.number(),
  nama: z.string().min(1).optional(),
  umur: z.number().int().positive().optional(),
  jenis_kelamin: z.enum(['Laki-laki', 'Perempuan']).optional(),
  alamat: z.string().min(1).optional(),
  kontak: z.string().min(1).optional(),
  tanggal_tindakan: z.coerce.date().optional(),
  catatan: z.string().nullable().optional()
});

export type UpdatePatientInput = z.infer<typeof updatePatientInputSchema>;

// Dashboard summary schema
export const dashboardSummarySchema = z.object({
  total_medications: z.number(),
  total_patients: z.number(),
  low_stock_medications: z.number(),
  recent_usages: z.number(),
  low_stock_items: z.array(medicationSchema)
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;

// Report filter schema
export const reportFilterSchema = z.object({
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  medication_id: z.number().optional()
});

export type ReportFilter = z.infer<typeof reportFilterSchema>;

// Usage report schema
export const usageReportSchema = z.object({
  medication_name: z.string(),
  total_used: z.number(),
  usage_count: z.number(),
  date_range: z.object({
    start: z.coerce.date(),
    end: z.coerce.date()
  })
});

export type UsageReport = z.infer<typeof usageReportSchema>;

// Patient report schema
export const patientReportSchema = z.object({
  total_patients: z.number(),
  patients_by_month: z.array(z.object({
    month: z.string(),
    count: z.number()
  })),
  patients_by_gender: z.object({
    'Laki-laki': z.number(),
    'Perempuan': z.number()
  })
});

export type PatientReport = z.infer<typeof patientReportSchema>;
