
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deletePatient = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Delete patient record
    const result = await db.delete(patientsTable)
      .where(eq(patientsTable.id, id))
      .returning()
      .execute();

    // Return success status based on whether a record was deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Patient deletion failed:', error);
    throw error;
  }
};
