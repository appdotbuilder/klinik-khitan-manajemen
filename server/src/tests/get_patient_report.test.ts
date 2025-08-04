
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type ReportFilter } from '../schema';
import { getPatientReport } from '../handlers/get_patient_report';

// Test data for patients - convert dates to strings for database insertion
const testPatients = [
  {
    nama: 'John Doe',
    umur: 30,
    jenis_kelamin: 'Laki-laki' as const,
    alamat: 'Jakarta',
    kontak: '08123456789',
    tanggal_tindakan: '2024-01-15',
    catatan: 'Checkup rutin'
  },
  {
    nama: 'Jane Smith',
    umur: 25,
    jenis_kelamin: 'Perempuan' as const,
    alamat: 'Bandung',
    kontak: '08987654321',
    tanggal_tindakan: '2024-01-20',
    catatan: null
  },
  {
    nama: 'Bob Wilson',
    umur: 45,
    jenis_kelamin: 'Laki-laki' as const,
    alamat: 'Surabaya',
    kontak: '08111222333',
    tanggal_tindakan: '2024-02-10',
    catatan: 'Konsultasi'
  },
  {
    nama: 'Alice Brown',
    umur: 35,
    jenis_kelamin: 'Perempuan' as const,
    alamat: 'Medan',
    kontak: '08444555666',
    tanggal_tindakan: '2024-02-15',
    catatan: null
  }
];

describe('getPatientReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate complete patient report without filters', async () => {
    // Insert test patients
    await db.insert(patientsTable).values(testPatients).execute();

    const filter: ReportFilter = {};
    const result = await getPatientReport(filter);

    // Check total patients
    expect(result.total_patients).toEqual(4);

    // Check gender distribution
    expect(result.patients_by_gender['Laki-laki']).toEqual(2);
    expect(result.patients_by_gender['Perempuan']).toEqual(2);

    // Check monthly distribution
    expect(result.patients_by_month).toHaveLength(2);
    expect(result.patients_by_month[0].month).toEqual('2024-01');
    expect(result.patients_by_month[0].count).toEqual(2);
    expect(result.patients_by_month[1].month).toEqual('2024-02');
    expect(result.patients_by_month[1].count).toEqual(2);
  });

  it('should filter patients by start date', async () => {
    // Insert test patients
    await db.insert(patientsTable).values(testPatients).execute();

    const filter: ReportFilter = {
      start_date: new Date('2024-02-01')
    };
    const result = await getPatientReport(filter);

    // Should only include February patients
    expect(result.total_patients).toEqual(2);
    expect(result.patients_by_month).toHaveLength(1);
    expect(result.patients_by_month[0].month).toEqual('2024-02');
    expect(result.patients_by_month[0].count).toEqual(2);

    // Gender distribution for February only
    expect(result.patients_by_gender['Laki-laki']).toEqual(1);
    expect(result.patients_by_gender['Perempuan']).toEqual(1);
  });

  it('should filter patients by end date', async () => {
    // Insert test patients
    await db.insert(patientsTable).values(testPatients).execute();

    const filter: ReportFilter = {
      end_date: new Date('2024-01-31')
    };
    const result = await getPatientReport(filter);

    // Should only include January patients
    expect(result.total_patients).toEqual(2);
    expect(result.patients_by_month).toHaveLength(1);
    expect(result.patients_by_month[0].month).toEqual('2024-01');
    expect(result.patients_by_month[0].count).toEqual(2);

    // Gender distribution for January only
    expect(result.patients_by_gender['Laki-laki']).toEqual(1);
    expect(result.patients_by_gender['Perempuan']).toEqual(1);
  });

  it('should filter patients by date range', async () => {
    // Insert test patients
    await db.insert(patientsTable).values(testPatients).execute();

    const filter: ReportFilter = {
      start_date: new Date('2024-01-18'),
      end_date: new Date('2024-02-12')
    };
    const result = await getPatientReport(filter);

    // Should include Jane (Jan 20) and Bob (Feb 10)
    expect(result.total_patients).toEqual(2);

    // Check gender distribution for filtered data
    expect(result.patients_by_gender['Laki-laki']).toEqual(1);
    expect(result.patients_by_gender['Perempuan']).toEqual(1);

    // Should have patients from both months
    expect(result.patients_by_month).toHaveLength(2);
  });

  it('should return empty report when no patients exist', async () => {
    const filter: ReportFilter = {};
    const result = await getPatientReport(filter);

    expect(result.total_patients).toEqual(0);
    expect(result.patients_by_month).toHaveLength(0);
    expect(result.patients_by_gender['Laki-laki']).toEqual(0);
    expect(result.patients_by_gender['Perempuan']).toEqual(0);
  });

  it('should return empty report when date filter excludes all patients', async () => {
    // Insert test patients
    await db.insert(patientsTable).values(testPatients).execute();

    const filter: ReportFilter = {
      start_date: new Date('2024-03-01'),
      end_date: new Date('2024-03-31')
    };
    const result = await getPatientReport(filter);

    expect(result.total_patients).toEqual(0);
    expect(result.patients_by_month).toHaveLength(0);
    expect(result.patients_by_gender['Laki-laki']).toEqual(0);
    expect(result.patients_by_gender['Perempuan']).toEqual(0);
  });

  it('should handle single gender data correctly', async () => {
    // Insert only male patients
    const malePatients = testPatients.filter(p => p.jenis_kelamin === 'Laki-laki');
    await db.insert(patientsTable).values(malePatients).execute();

    const filter: ReportFilter = {};
    const result = await getPatientReport(filter);

    expect(result.total_patients).toEqual(2);
    expect(result.patients_by_gender['Laki-laki']).toEqual(2);
    expect(result.patients_by_gender['Perempuan']).toEqual(0);
  });
});
