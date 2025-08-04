
import { db } from '../db';
import { medicationsTable } from '../db/schema';
import { type Medication } from '../schema';
import { lte } from 'drizzle-orm';

export const getLowStockMedications = async (): Promise<Medication[]> => {
  try {
    // Query medications where stock available is less than or equal to threshold
    const results = await db.select()
      .from(medicationsTable)
      .where(lte(medicationsTable.stok_tersedia, medicationsTable.ambang_batas))
      .execute();

    // Return the results - no numeric conversion needed as all fields are integers
    return results;
  } catch (error) {
    console.error('Failed to fetch low stock medications:', error);
    throw error;
  }
};
