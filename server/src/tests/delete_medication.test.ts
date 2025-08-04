
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { medicationsTable, usageTable } from '../db/schema';
import { deleteMedication } from '../handlers/delete_medication';
import { eq } from 'drizzle-orm';

describe('deleteMedication', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a medication successfully', async () => {
    // Create a test medication
    const medication = await db.insert(medicationsTable)
      .values({
        nama_obat: 'Test Medicine',
        jenis: 'Tablet',
        stok_tersedia: 100,
        ambang_batas: 10
      })
      .returning()
      .execute();

    const medicationId = medication[0].id;

    // Delete the medication
    const result = await deleteMedication(medicationId);

    expect(result.success).toBe(true);

    // Verify medication is deleted from database
    const deletedMedication = await db.select()
      .from(medicationsTable)
      .where(eq(medicationsTable.id, medicationId))
      .execute();

    expect(deletedMedication).toHaveLength(0);
  });

  it('should throw error when medication not found', async () => {
    const nonExistentId = 999;

    await expect(deleteMedication(nonExistentId))
      .rejects.toThrow(/medication with id 999 not found/i);
  });

  it('should throw error when medication has usage records', async () => {
    // Create a test medication
    const medication = await db.insert(medicationsTable)
      .values({
        nama_obat: 'Test Medicine',
        jenis: 'Tablet',
        stok_tersedia: 100,
        ambang_batas: 10
      })
      .returning()
      .execute();

    const medicationId = medication[0].id;

    // Create a usage record for this medication
    await db.insert(usageTable)
      .values({
        id_obat: medicationId,
        tanggal: '2024-01-15',
        jumlah_dipakai: 5,
        catatan: 'Test usage'
      })
      .execute();

    // Try to delete the medication
    await expect(deleteMedication(medicationId))
      .rejects.toThrow(/cannot delete medication.*associated usage records/i);

    // Verify medication still exists in database
    const existingMedication = await db.select()
      .from(medicationsTable)
      .where(eq(medicationsTable.id, medicationId))
      .execute();

    expect(existingMedication).toHaveLength(1);
  });

  it('should allow deletion of medication without usage records even when other medications have usage', async () => {
    // Create two medications
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
          jenis: 'Syrup',
          stok_tersedia: 50,
          ambang_batas: 5
        }
      ])
      .returning()
      .execute();

    const medicationAId = medications[0].id;
    const medicationBId = medications[1].id;

    // Create usage record only for medication A
    await db.insert(usageTable)
      .values({
        id_obat: medicationAId,
        tanggal: '2024-01-15',
        jumlah_dipakai: 5,
        catatan: 'Test usage for A'
      })
      .execute();

    // Should be able to delete medication B (no usage records)
    const result = await deleteMedication(medicationBId);
    expect(result.success).toBe(true);

    // Verify medication B is deleted
    const deletedMedication = await db.select()
      .from(medicationsTable)
      .where(eq(medicationsTable.id, medicationBId))
      .execute();

    expect(deletedMedication).toHaveLength(0);

    // Verify medication A still exists
    const existingMedication = await db.select()
      .from(medicationsTable)
      .where(eq(medicationsTable.id, medicationAId))
      .execute();

    expect(existingMedication).toHaveLength(1);
  });
});
