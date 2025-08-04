
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type Patient } from '../schema';

export const getPatients = async (): Promise<Patient[]> => {
  try {
    const results = await db.select()
      .from(patientsTable)
      .execute();

    return results.map(patient => ({
      ...patient,
      tanggal_tindakan: new Date(patient.tanggal_tindakan) // Convert string to Date
    }));
  } catch (error) {
    console.error('Failed to fetch patients:', error);
    throw error;
  }
};
