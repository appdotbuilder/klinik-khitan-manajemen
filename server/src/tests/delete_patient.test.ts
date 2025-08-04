
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type CreatePatientInput } from '../schema';
import { deletePatient } from '../handlers/delete_patient';
import { eq } from 'drizzle-orm';

// Test patient input
const testPatientInput: CreatePatientInput = {
  nama: 'John Doe',
  umur: 30,
  jenis_kelamin: 'Laki-laki',
  alamat: 'Jl. Test No. 123',
  kontak: '081234567890',
  tanggal_tindakan: new Date('2024-01-15'),
  catatan: 'Test patient record'
};

describe('deletePatient', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing patient', async () => {
    // Create a patient first
    const createdPatients = await db.insert(patientsTable)
      .values({
        nama: testPatientInput.nama,
        umur: testPatientInput.umur,
        jenis_kelamin: testPatientInput.jenis_kelamin,
        alamat: testPatientInput.alamat,
        kontak: testPatientInput.kontak,
        tanggal_tindakan: testPatientInput.tanggal_tindakan.toISOString().split('T')[0],
        catatan: testPatientInput.catatan
      })
      .returning()
      .execute();

    const patientId = createdPatients[0].id;

    // Delete the patient
    const result = await deletePatient(patientId);

    // Verify deletion was successful
    expect(result.success).toBe(true);
  });

  it('should remove patient from database', async () => {
    // Create a patient first
    const createdPatients = await db.insert(patientsTable)
      .values({
        nama: testPatientInput.nama,
        umur: testPatientInput.umur,
        jenis_kelamin: testPatientInput.jenis_kelamin,
        alamat: testPatientInput.alamat,
        kontak: testPatientInput.kontak,
        tanggal_tindakan: testPatientInput.tanggal_tindakan.toISOString().split('T')[0],
        catatan: testPatientInput.catatan
      })
      .returning()
      .execute();

    const patientId = createdPatients[0].id;

    // Delete the patient
    await deletePatient(patientId);

    // Verify patient no longer exists in database
    const patients = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, patientId))
      .execute();

    expect(patients).toHaveLength(0);
  });

  it('should return false for non-existent patient', async () => {
    // Try to delete a patient that doesn't exist
    const result = await deletePatient(999);

    // Verify deletion was not successful
    expect(result.success).toBe(false);
  });

  it('should not affect other patients when deleting one', async () => {
    // Create two patients
    const patients = await db.insert(patientsTable)
      .values([
        {
          nama: 'Patient 1',
          umur: 25,
          jenis_kelamin: 'Laki-laki',
          alamat: 'Address 1',
          kontak: '081111111111',
          tanggal_tindakan: '2024-01-15',
          catatan: 'Patient 1 notes'
        },
        {
          nama: 'Patient 2',
          umur: 35,
          jenis_kelamin: 'Perempuan',
          alamat: 'Address 2',
          kontak: '082222222222',
          tanggal_tindakan: '2024-01-16',
          catatan: 'Patient 2 notes'
        }
      ])
      .returning()
      .execute();

    const firstPatientId = patients[0].id;
    const secondPatientId = patients[1].id;

    // Delete first patient
    const result = await deletePatient(firstPatientId);

    expect(result.success).toBe(true);

    // Verify first patient is deleted
    const deletedPatient = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, firstPatientId))
      .execute();

    expect(deletedPatient).toHaveLength(0);

    // Verify second patient still exists
    const remainingPatient = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, secondPatientId))
      .execute();

    expect(remainingPatient).toHaveLength(1);
    expect(remainingPatient[0].nama).toEqual('Patient 2');
  });
});
