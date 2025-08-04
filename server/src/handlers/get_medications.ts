
import { db } from '../db';
import { medicationsTable } from '../db/schema';
import { type Medication } from '../schema';

export const getMedications = async (): Promise<Medication[]> => {
  try {
    const results = await db.select()
      .from(medicationsTable)
      .execute();

    // Return the medications - no numeric conversions needed since all fields are integers or text
    return results;
  } catch (error) {
    console.error('Failed to fetch medications:', error);
    throw error;
  }
};
