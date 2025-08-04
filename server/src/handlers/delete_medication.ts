
import { db } from '../db';
import { medicationsTable, usageTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteMedication = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Check if medication exists
    const medication = await db.select()
      .from(medicationsTable)
      .where(eq(medicationsTable.id, id))
      .execute();

    if (medication.length === 0) {
      throw new Error(`Medication with id ${id} not found`);
    }

    // Check if medication is being used in usage records
    const usageRecords = await db.select()
      .from(usageTable)
      .where(eq(usageTable.id_obat, id))
      .execute();

    if (usageRecords.length > 0) {
      throw new Error(`Cannot delete medication with id ${id} because it has associated usage records`);
    }

    // Delete the medication
    await db.delete(medicationsTable)
      .where(eq(medicationsTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Medication deletion failed:', error);
    throw error;
  }
};
