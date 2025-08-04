
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type UpdatePatientInput, type Patient } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePatient = async (input: UpdatePatientInput): Promise<Patient> => {
  try {
    // First check if patient exists
    const existingPatient = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, input.id))
      .execute();

    if (existingPatient.length === 0) {
      throw new Error(`Patient with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.nama !== undefined) updateData.nama = input.nama;
    if (input.umur !== undefined) updateData.umur = input.umur;
    if (input.jenis_kelamin !== undefined) updateData.jenis_kelamin = input.jenis_kelamin;
    if (input.alamat !== undefined) updateData.alamat = input.alamat;
    if (input.kontak !== undefined) updateData.kontak = input.kontak;
    if (input.tanggal_tindakan !== undefined) {
      // Convert Date to string for date column
      updateData.tanggal_tindakan = input.tanggal_tindakan.toISOString().split('T')[0];
    }
    if (input.catatan !== undefined) updateData.catatan = input.catatan;

    // Update the patient record
    const result = await db.update(patientsTable)
      .set(updateData)
      .where(eq(patientsTable.id, input.id))
      .returning()
      .execute();

    // Convert date string back to Date object for return value
    const patient = result[0];
    return {
      ...patient,
      tanggal_tindakan: new Date(patient.tanggal_tindakan)
    };
  } catch (error) {
    console.error('Patient update failed:', error);
    throw error;
  }
};
