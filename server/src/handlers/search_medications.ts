
import { db } from '../db';
import { medicationsTable } from '../db/schema';
import { type Medication } from '../schema';
import { or, ilike } from 'drizzle-orm';

export const searchMedications = async (query: string): Promise<Medication[]> => {
  try {
    // Perform case-insensitive search across nama_obat and jenis fields
    const results = await db.select()
      .from(medicationsTable)
      .where(
        or(
          ilike(medicationsTable.nama_obat, `%${query}%`),
          ilike(medicationsTable.jenis, `%${query}%`)
        )
      )
      .execute();

    return results;
  } catch (error) {
    console.error('Medication search failed:', error);
    throw error;
  }
};
