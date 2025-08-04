
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type CreatePatientInput, type Patient } from '../schema';

export const createPatient = async (input: CreatePatientInput): Promise<Patient> => {
  try {
    // Insert patient record
    const result = await db.insert(patientsTable)
      .values({
        nama: input.nama,
        umur: input.umur,
        jenis_kelamin: input.jenis_kelamin,
        alamat: input.alamat,
        kontak: input.kontak,
        tanggal_tindakan: input.tanggal_tindakan.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        catatan: input.catatan
      })
      .returning()
      .execute();

    // Convert date string back to Date object before returning
    const patient = result[0];
    return {
      ...patient,
      tanggal_tindakan: new Date(patient.tanggal_tindakan) // Convert string back to Date
    };
  } catch (error) {
    console.error('Patient creation failed:', error);
    throw error;
  }
};
