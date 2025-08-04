
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usageTable, medicationsTable } from '../db/schema';
import { type CreateUsageInput } from '../schema';
import { createUsage } from '../handlers/create_usage';
import { eq } from 'drizzle-orm';

describe('createUsage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a usage record and reduce medication stock', async () => {
    // Create test medication first
    const medicationResult = await db.insert(medicationsTable)
      .values({
        nama_obat: 'Test Medicine',
        jenis: 'Tablet',
        stok_tersedia: 100,
        ambang_batas: 10
      })
      .returning()
      .execute();

    const medication = medicationResult[0];

    const testInput: CreateUsageInput = {
      id_obat: medication.id,
      tanggal: new Date('2024-01-15'),
      jumlah_dipakai: 25,
      catatan: 'Test usage'
    };

    const result = await createUsage(testInput);

    // Verify usage record creation
    expect(result.id_obat).toEqual(medication.id);
    expect(result.tanggal).toEqual(new Date('2024-01-15'));
    expect(result.jumlah_dipakai).toEqual(25);
    expect(result.catatan).toEqual('Test usage');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify medication stock was reduced
    const updatedMedication = await db.select()
      .from(medicationsTable)
      .where(eq(medicationsTable.id, medication.id))
      .execute();

    expect(updatedMedication[0].stok_tersedia).toEqual(75); // 100 - 25
    expect(updatedMedication[0].updated_at).toBeInstanceOf(Date);
  });

  it('should save usage record to database', async () => {
    // Create test medication
    const medicationResult = await db.insert(medicationsTable)
      .values({
        nama_obat: 'Test Medicine',
        jenis: 'Syrup',
        stok_tersedia: 50,
        ambang_batas: 5
      })
      .returning()
      .execute();

    const medication = medicationResult[0];

    const testInput: CreateUsageInput = {
      id_obat: medication.id,
      tanggal: new Date('2024-02-20'),
      jumlah_dipakai: 10,
      catatan: null
    };

    const result = await createUsage(testInput);

    // Query database to verify record was saved
    const usageRecords = await db.select()
      .from(usageTable)
      .where(eq(usageTable.id, result.id))
      .execute();

    expect(usageRecords).toHaveLength(1);
    expect(usageRecords[0].id_obat).toEqual(medication.id);
    expect(usageRecords[0].jumlah_dipakai).toEqual(10);
    expect(usageRecords[0].catatan).toBeNull();
    expect(new Date(usageRecords[0].tanggal)).toEqual(new Date('2024-02-20'));
    expect(usageRecords[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when medication does not exist', async () => {
    const testInput: CreateUsageInput = {
      id_obat: 999, // Non-existent medication ID
      tanggal: new Date('2024-01-15'),
      jumlah_dipakai: 10,
      catatan: 'Test usage'
    };

    await expect(createUsage(testInput)).rejects.toThrow(/medication.*not found/i);
  });

  it('should throw error when insufficient stock available', async () => {
    // Create medication with low stock
    const medicationResult = await db.insert(medicationsTable)
      .values({
        nama_obat: 'Low Stock Medicine',
        jenis: 'Capsule',
        stok_tersedia: 5,
        ambang_batas: 2
      })
      .returning()
      .execute();

    const medication = medicationResult[0];

    const testInput: CreateUsageInput = {
      id_obat: medication.id,
      tanggal: new Date('2024-01-15'),
      jumlah_dipakai: 10, // More than available stock
      catatan: 'Test usage'
    };

    await expect(createUsage(testInput)).rejects.toThrow(/insufficient stock/i);

    // Verify no changes were made to medication stock
    const unchangedMedication = await db.select()
      .from(medicationsTable)
      .where(eq(medicationsTable.id, medication.id))
      .execute();

    expect(unchangedMedication[0].stok_tersedia).toEqual(5); // Should remain unchanged
  });

  it('should handle exact stock match correctly', async () => {
    // Create medication with exact stock amount
    const medicationResult = await db.insert(medicationsTable)
      .values({
        nama_obat: 'Exact Stock Medicine',
        jenis: 'Tablet',
        stok_tersedia: 15,
        ambang_batas: 3
      })
      .returning()
      .execute();

    const medication = medicationResult[0];

    const testInput: CreateUsageInput = {
      id_obat: medication.id,
      tanggal: new Date('2024-03-10'),
      jumlah_dipakai: 15, // Exact stock amount
      catatan: 'Complete stock usage'
    };

    const result = await createUsage(testInput);

    expect(result.jumlah_dipakai).toEqual(15);

    // Verify stock is now zero
    const depletedMedication = await db.select()
      .from(medicationsTable)
      .where(eq(medicationsTable.id, medication.id))
      .execute();

    expect(depletedMedication[0].stok_tersedia).toEqual(0);
  });
});
