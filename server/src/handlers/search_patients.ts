
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type Patient } from '../schema';
import { or, ilike } from 'drizzle-orm';

export const searchPatients = async (query: string): Promise<Patient[]> => {
  try {
    // If query is empty, return empty array
    if (!query.trim()) {
      return [];
    }

    // Search pattern for case-insensitive partial matching
    const searchPattern = `%${query.trim()}%`;

    // Search across nama, kontak, and alamat fields
    const results = await db.select()
      .from(patientsTable)
      .where(
        or(
          ilike(patientsTable.nama, searchPattern),
          ilike(patientsTable.kontak, searchPattern),
          ilike(patientsTable.alamat, searchPattern)
        )
      )
      .execute();

    // Convert date strings back to Date objects to match schema
    return results.map(patient => ({
      ...patient,
      tanggal_tindakan: new Date(patient.tanggal_tindakan)
    }));
  } catch (error) {
    console.error('Patient search failed:', error);
    throw error;
  }
};
