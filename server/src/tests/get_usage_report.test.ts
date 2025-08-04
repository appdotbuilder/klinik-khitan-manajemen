
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { medicationsTable, usageTable } from '../db/schema';
import { type ReportFilter } from '../schema';
import { getUsageReport } from '../handlers/get_usage_report';

describe('getUsageReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no usage data exists', async () => {
    const filter: ReportFilter = {};
    const result = await getUsageReport(filter);

    expect(result).toHaveLength(0);
  });

  it('should generate usage report for all medications', async () => {
    // Create test medications
    const medications = await db.insert(medicationsTable)
      .values([
        {
          nama_obat: 'Paracetamol',
          jenis: 'Tablet',
          stok_tersedia: 100,
          ambang_batas: 10
        },
        {
          nama_obat: 'Ibuprofen',
          jenis: 'Kapsul',
          stok_tersedia: 50,
          ambang_batas: 5
        }
      ])
      .returning()
      .execute();

    // Create usage records with string dates
    await db.insert(usageTable)
      .values([
        {
          id_obat: medications[0].id,
          tanggal: '2024-01-15',
          jumlah_dipakai: 10,
          catatan: 'Usage 1'
        },
        {
          id_obat: medications[0].id,
          tanggal: '2024-01-20',
          jumlah_dipakai: 15,
          catatan: 'Usage 2'
        },
        {
          id_obat: medications[1].id,
          tanggal: '2024-01-18',
          jumlah_dipakai: 5,
          catatan: 'Usage 3'
        }
      ])
      .execute();

    const filter: ReportFilter = {};
    const result = await getUsageReport(filter);

    expect(result).toHaveLength(2);
    
    // Find Paracetamol report
    const paracetamolReport = result.find(r => r.medication_name === 'Paracetamol');
    expect(paracetamolReport).toBeDefined();
    expect(paracetamolReport!.total_used).toEqual(25);
    expect(paracetamolReport!.usage_count).toEqual(2);
    expect(paracetamolReport!.date_range.start).toBeInstanceOf(Date);
    expect(paracetamolReport!.date_range.end).toBeInstanceOf(Date);

    // Find Ibuprofen report
    const ibuprofenReport = result.find(r => r.medication_name === 'Ibuprofen');
    expect(ibuprofenReport).toBeDefined();
    expect(ibuprofenReport!.total_used).toEqual(5);
    expect(ibuprofenReport!.usage_count).toEqual(1);
  });

  it('should filter usage report by date range', async () => {
    // Create test medication
    const medication = await db.insert(medicationsTable)
      .values({
        nama_obat: 'Test Medicine',
        jenis: 'Tablet',
        stok_tersedia: 100,
        ambang_batas: 10
      })
      .returning()
      .execute();

    // Create usage records with different dates (using string format)
    await db.insert(usageTable)
      .values([
        {
          id_obat: medication[0].id,
          tanggal: '2024-01-10', // Before range
          jumlah_dipakai: 5,
          catatan: 'Before range'
        },
        {
          id_obat: medication[0].id,
          tanggal: '2024-01-20', // Within range
          jumlah_dipakai: 10,
          catatan: 'Within range'
        },
        {
          id_obat: medication[0].id,
          tanggal: '2024-01-25', // Within range
          jumlah_dipakai: 8,
          catatan: 'Within range'
        },
        {
          id_obat: medication[0].id,
          tanggal: '2024-02-05', // After range
          jumlah_dipakai: 12,
          catatan: 'After range'
        }
      ])
      .execute();

    const filter: ReportFilter = {
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-01-31')
    };

    const result = await getUsageReport(filter);

    expect(result).toHaveLength(1);
    expect(result[0].medication_name).toEqual('Test Medicine');
    expect(result[0].total_used).toEqual(18); // Only 10 + 8 within range
    expect(result[0].usage_count).toEqual(2);
  });

  it('should filter usage report by medication ID', async () => {
    // Create test medications
    const medications = await db.insert(medicationsTable)
      .values([
        {
          nama_obat: 'Medicine A',
          jenis: 'Tablet',
          stok_tersedia: 100,
          ambang_batas: 10
        },
        {
          nama_obat: 'Medicine B',
          jenis: 'Kapsul',
          stok_tersedia: 50,
          ambang_batas: 5
        }
      ])
      .returning()
      .execute();

    // Create usage records for both medications
    await db.insert(usageTable)
      .values([
        {
          id_obat: medications[0].id,
          tanggal: '2024-01-15',
          jumlah_dipakai: 10,
          catatan: 'Medicine A usage'
        },
        {
          id_obat: medications[1].id,
          tanggal: '2024-01-15',
          jumlah_dipakai: 5,
          catatan: 'Medicine B usage'
        }
      ])
      .execute();

    const filter: ReportFilter = {
      medication_id: medications[0].id
    };

    const result = await getUsageReport(filter);

    expect(result).toHaveLength(1);
    expect(result[0].medication_name).toEqual('Medicine A');
    expect(result[0].total_used).toEqual(10);
    expect(result[0].usage_count).toEqual(1);
  });

  it('should handle combined filters', async () => {
    // Create test medication
    const medication = await db.insert(medicationsTable)
      .values({
        nama_obat: 'Combined Filter Test',
        jenis: 'Tablet',
        stok_tersedia: 100,
        ambang_batas: 10
      })
      .returning()
      .execute();

    // Create usage records
    await db.insert(usageTable)
      .values([
        {
          id_obat: medication[0].id,
          tanggal: '2024-01-10',
          jumlah_dipakai: 5,
          catatan: 'Before range'
        },
        {
          id_obat: medication[0].id,
          tanggal: '2024-01-20',
          jumlah_dipakai: 15,
          catatan: 'Within range'
        }
      ])
      .execute();

    const filter: ReportFilter = {
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-01-25'),
      medication_id: medication[0].id
    };

    const result = await getUsageReport(filter);

    expect(result).toHaveLength(1);
    expect(result[0].medication_name).toEqual('Combined Filter Test');
    expect(result[0].total_used).toEqual(15); // Only the usage within date range
    expect(result[0].usage_count).toEqual(1);
  });

  it('should return empty array when no usage matches filters', async () => {
    // Create test medication
    const medication = await db.insert(medicationsTable)
      .values({
        nama_obat: 'Test Medicine',
        jenis: 'Tablet',
        stok_tersedia: 100,
        ambang_batas: 10
      })
      .returning()
      .execute();

    // Create usage record outside filter range
    await db.insert(usageTable)
      .values({
        id_obat: medication[0].id,
        tanggal: '2024-01-10',
        jumlah_dipakai: 5,
        catatan: 'Outside range'
      })
      .execute();

    const filter: ReportFilter = {
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-02-28')
    };

    const result = await getUsageReport(filter);

    expect(result).toHaveLength(0);
  });

  it('should handle date conversion correctly', async () => {
    // Create test data
    const medication = await db.insert(medicationsTable)
      .values({
        nama_obat: 'Date Test Medicine',
        jenis: 'Tablet',
        stok_tersedia: 100,
        ambang_batas: 10
      })
      .returning()
      .execute();

    await db.insert(usageTable)
      .values({
        id_obat: medication[0].id,
        tanggal: '2024-01-15',
        jumlah_dipakai: 10,
        catatan: 'Date test'
      })
      .execute();

    const filter: ReportFilter = {};
    const result = await getUsageReport(filter);

    expect(result).toHaveLength(1);
    expect(result[0].date_range.start).toBeInstanceOf(Date);
    expect(result[0].date_range.end).toBeInstanceOf(Date);
    expect(result[0].date_range.start.toISOString().split('T')[0]).toEqual('2024-01-15');
    expect(result[0].date_range.end.toISOString().split('T')[0]).toEqual('2024-01-15');
  });
});
