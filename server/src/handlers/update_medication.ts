
import { db } from '../db';
import { medicationsTable } from '../db/schema';
import { type UpdateMedicationInput, type Medication } from '../schema';
import { eq } from 'drizzle-orm';

export const updateMedication = async (input: UpdateMedicationInput): Promise<Medication> => {
  try {
    // Check if medication exists
    const existingMedication = await db.select()
      .from(medicationsTable)
      .where(eq(medicationsTable.id, input.id))
      .execute();

    if (existingMedication.length === 0) {
      throw new Error(`Medication with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof medicationsTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.nama_obat !== undefined) {
      updateData.nama_obat = input.nama_obat;
    }
    if (input.jenis !== undefined) {
      updateData.jenis = input.jenis;
    }
    if (input.stok_tersedia !== undefined) {
      updateData.stok_tersedia = input.stok_tersedia;
    }
    if (input.ambang_batas !== undefined) {
      updateData.ambang_batas = input.ambang_batas;
    }

    // Update medication record
    const result = await db.update(medicationsTable)
      .set(updateData)
      .where(eq(medicationsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Medication update failed:', error);
    throw error;
  }
};
