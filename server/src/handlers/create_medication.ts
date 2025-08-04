
import { db } from '../db';
import { medicationsTable } from '../db/schema';
import { type CreateMedicationInput, type Medication } from '../schema';

export const createMedication = async (input: CreateMedicationInput): Promise<Medication> => {
  try {
    // Insert medication record
    const result = await db.insert(medicationsTable)
      .values({
        nama_obat: input.nama_obat,
        jenis: input.jenis,
        stok_tersedia: input.stok_tersedia,
        ambang_batas: input.ambang_batas
      })
      .returning()
      .execute();

    const medication = result[0];
    return medication;
  } catch (error) {
    console.error('Medication creation failed:', error);
    throw error;
  }
};
