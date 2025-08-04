
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { medicationsTable, usageTable, patientsTable } from '../db/schema';
import { getDashboardSummary } from '../handlers/get_dashboard_summary';

describe('getDashboardSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty dashboard summary when no data exists', async () => {
    const result = await getDashboardSummary();

    expect(result.total_medications).toBe(0);
    expect(result.total_patients).toBe(0);
    expect(result.low_stock_medications).toBe(0);
    expect(result.recent_usages).toBe(0);
    expect(result.low_stock_items).toHaveLength(0);
  });

  it('should return correct counts with sample data', async () => {
    // Insert test medications
    const medications = await db.insert(medicationsTable)
      .values([
        {
          nama_obat: 'Paracetamol',
          jenis: 'Tablet',
          stok_tersedia: 100,
          ambang_batas: 20
        },
        {
          nama_obat: 'Amoxicillin',
          jenis: 'Kapsul',
          stok_tersedia: 15, // Low stock
          ambang_batas: 20
        },
        {
          nama_obat: 'Ibuprofen',
          jenis: 'Tablet',
          stok_tersedia: 5, // Low stock
          ambang_batas: 10
        }
      ])
      .returning()
      .execute();

    // Insert test patients
    await db.insert(patientsTable)
      .values([
        {
          nama: 'John Doe',
          umur: 30,
          jenis_kelamin: 'Laki-laki',
          alamat: 'Jakarta',
          kontak: '08123456789',
          tanggal_tindakan: '2024-01-15',
          catatan: null
        },
        {
          nama: 'Jane Smith',
          umur: 25,
          jenis_kelamin: 'Perempuan',
          alamat: 'Bandung',
          kontak: '08987654321',
          tanggal_tindakan: '2024-01-16',
          catatan: 'Follow up needed'
        }
      ])
      .execute();

    // Insert recent usage
    await db.insert(usageTable)
      .values({
        id_obat: medications[0].id,
        tanggal: '2024-01-20',
        jumlah_dipakai: 10,
        catatan: 'Morning dose'
      })
      .execute();

    const result = await getDashboardSummary();

    expect(result.total_medications).toBe(3);
    expect(result.total_patients).toBe(2);
    expect(result.low_stock_medications).toBe(2); // Amoxicillin and Ibuprofen
    expect(result.recent_usages).toBe(1);
    expect(result.low_stock_items).toHaveLength(2);
    
    // Verify low stock items details
    const lowStockNames = result.low_stock_items.map(item => item.nama_obat);
    expect(lowStockNames).toContain('Amoxicillin');
    expect(lowStockNames).toContain('Ibuprofen');
  });

  it('should only count recent usages from last 30 days', async () => {
    // Insert test medication
    const [medication] = await db.insert(medicationsTable)
      .values({
        nama_obat: 'Test Medicine',
        jenis: 'Tablet',
        stok_tersedia: 100,
        ambang_batas: 20
      })
      .returning()
      .execute();

    // Insert old usage (more than 30 days ago)
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 40);
    
    await db.insert(usageTable)
      .values({
        id_obat: medication.id,
        tanggal: '2023-12-01',
        jumlah_dipakai: 5,
        catatan: 'Old usage',
        created_at: oldDate
      })
      .execute();

    // Insert recent usage
    await db.insert(usageTable)
      .values({
        id_obat: medication.id,
        tanggal: '2024-01-20',
        jumlah_dipakai: 3,
        catatan: 'Recent usage'
      })
      .execute();

    const result = await getDashboardSummary();

    expect(result.recent_usages).toBe(1); // Only the recent usage should be counted
  });

  it('should correctly identify low stock medications', async () => {
    // Insert medications with different stock levels
    await db.insert(medicationsTable)
      .values([
        {
          nama_obat: 'Normal Stock',
          jenis: 'Tablet',
          stok_tersedia: 50,
          ambang_batas: 20 // Above threshold
        },
        {
          nama_obat: 'Exactly At Threshold',
          jenis: 'Kapsul',
          stok_tersedia: 20,
          ambang_batas: 20 // Equal to threshold (not low stock)
        },
        {
          nama_obat: 'Low Stock Item',
          jenis: 'Sirup',
          stok_tersedia: 19,
          ambang_batas: 20 // Below threshold
        }
      ])
      .execute();

    const result = await getDashboardSummary();

    expect(result.low_stock_medications).toBe(1);
    expect(result.low_stock_items).toHaveLength(1);
    expect(result.low_stock_items[0].nama_obat).toBe('Low Stock Item');
    expect(result.low_stock_items[0].stok_tersedia).toBe(19);
    expect(result.low_stock_items[0].ambang_batas).toBe(20);
  });
});
