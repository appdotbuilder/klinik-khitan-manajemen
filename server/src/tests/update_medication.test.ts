
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { medicationsTable } from '../db/schema';
import { type UpdateMedicationInput, type CreateMedicationInput } from '../schema';
import { updateMedication } from '../handlers/update_medication';
import { eq } from 'drizzle-orm';

const testMedicationInput: CreateMedicationInput = {
  nama_obat: 'Original Medicine',
  jenis: 'Tablet',
  stok_tersedia: 100,
  ambang_batas: 10
};

describe('updateMedication', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a medication with all fields', async () => {
    // Create initial medication
    const createResult = await db.insert(medicationsTable)
      .values(testMedicationInput)
      .returning()
      .execute();
    
    const createdMedication = createResult[0];

    const updateInput: UpdateMedicationInput = {
      id: createdMedication.id,
      nama_obat: 'Updated Medicine',
      jenis: 'Sirup',
      stok_tersedia: 150,
      ambang_batas: 20
    };

    const result = await updateMedication(updateInput);

    expect(result.id).toEqual(createdMedication.id);
    expect(result.nama_obat).toEqual('Updated Medicine');
    expect(result.jenis).toEqual('Sirup');
    expect(result.stok_tersedia).toEqual(150);
    expect(result.ambang_batas).toEqual(20);
    expect(result.created_at).toEqual(createdMedication.created_at);
    expect(result.updated_at).not.toEqual(createdMedication.updated_at);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update medication with partial fields', async () => {
    // Create initial medication
    const createResult = await db.insert(medicationsTable)
      .values(testMedicationInput)
      .returning()
      .execute();
    
    const createdMedication = createResult[0];

    const updateInput: UpdateMedicationInput = {
      id: createdMedication.id,
      nama_obat: 'Partially Updated Medicine',
      stok_tersedia: 200
    };

    const result = await updateMedication(updateInput);

    expect(result.id).toEqual(createdMedication.id);
    expect(result.nama_obat).toEqual('Partially Updated Medicine');
    expect(result.jenis).toEqual('Tablet'); // Should remain unchanged
    expect(result.stok_tersedia).toEqual(200);
    expect(result.ambang_batas).toEqual(10); // Should remain unchanged
    expect(result.updated_at).not.toEqual(createdMedication.updated_at);
  });

  it('should save updated medication to database', async () => {
    // Create initial medication
    const createResult = await db.insert(medicationsTable)
      .values(testMedicationInput)
      .returning()
      .execute();
    
    const createdMedication = createResult[0];

    const updateInput: UpdateMedicationInput = {
      id: createdMedication.id,
      nama_obat: 'Database Test Medicine',
      stok_tersedia: 300
    };

    await updateMedication(updateInput);

    // Verify in database
    const medications = await db.select()
      .from(medicationsTable)
      .where(eq(medicationsTable.id, createdMedication.id))
      .execute();

    expect(medications).toHaveLength(1);
    expect(medications[0].nama_obat).toEqual('Database Test Medicine');
    expect(medications[0].stok_tersedia).toEqual(300);
    expect(medications[0].jenis).toEqual('Tablet'); // Unchanged
    expect(medications[0].ambang_batas).toEqual(10); // Unchanged
  });

  it('should throw error when medication not found', async () => {
    const updateInput: UpdateMedicationInput = {
      id: 999, // Non-existent ID
      nama_obat: 'Non-existent Medicine'
    };

    await expect(updateMedication(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update only updated_at when no other fields provided', async () => {
    // Create initial medication
    const createResult = await db.insert(medicationsTable)
      .values(testMedicationInput)
      .returning()
      .execute();
    
    const createdMedication = createResult[0];

    const updateInput: UpdateMedicationInput = {
      id: createdMedication.id
    };

    const result = await updateMedication(updateInput);

    expect(result.id).toEqual(createdMedication.id);
    expect(result.nama_obat).toEqual(createdMedication.nama_obat);
    expect(result.jenis).toEqual(createdMedication.jenis);
    expect(result.stok_tersedia).toEqual(createdMedication.stok_tersedia);
    expect(result.ambang_batas).toEqual(createdMedication.ambang_batas);
    expect(result.created_at).toEqual(createdMedication.created_at);
    expect(result.updated_at).not.toEqual(createdMedication.updated_at);
  });
});
