
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type UpdatePatientInput } from '../schema';
import { updatePatient } from '../handlers/update_patient';
import { eq } from 'drizzle-orm';

// Helper function to create a test patient
const createTestPatient = async (): Promise<number> => {
  const result = await db.insert(patientsTable)
    .values({
      nama: 'Test Patient',
      umur: 30,
      jenis_kelamin: 'Laki-laki',
      alamat: 'Test Address',
      kontak: '123456789',
      tanggal_tindakan: '2024-01-01', // Use string format for date column
      catatan: 'Initial notes'
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('updatePatient', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all patient fields', async () => {
    const patientId = await createTestPatient();

    const updateInput: UpdatePatientInput = {
      id: patientId,
      nama: 'Updated Name',
      umur: 35,
      jenis_kelamin: 'Perempuan',
      alamat: 'Updated Address',
      kontak: '987654321',
      tanggal_tindakan: new Date('2024-02-01'),
      catatan: 'Updated notes'
    };

    const result = await updatePatient(updateInput);

    expect(result.id).toEqual(patientId);
    expect(result.nama).toEqual('Updated Name');
    expect(result.umur).toEqual(35);
    expect(result.jenis_kelamin).toEqual('Perempuan');
    expect(result.alamat).toEqual('Updated Address');
    expect(result.kontak).toEqual('987654321');
    expect(result.tanggal_tindakan).toEqual(new Date('2024-02-01'));
    expect(result.catatan).toEqual('Updated notes');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    const patientId = await createTestPatient();

    const updateInput: UpdatePatientInput = {
      id: patientId,
      nama: 'Partially Updated Name',
      umur: 40
    };

    const result = await updatePatient(updateInput);

    expect(result.id).toEqual(patientId);
    expect(result.nama).toEqual('Partially Updated Name');
    expect(result.umur).toEqual(40);
    // These should remain unchanged
    expect(result.jenis_kelamin).toEqual('Laki-laki');
    expect(result.alamat).toEqual('Test Address');
    expect(result.kontak).toEqual('123456789');
    expect(result.tanggal_tindakan).toEqual(new Date('2024-01-01'));
    expect(result.catatan).toEqual('Initial notes');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update catatan to null', async () => {
    const patientId = await createTestPatient();

    const updateInput: UpdatePatientInput = {
      id: patientId,
      catatan: null
    };

    const result = await updatePatient(updateInput);

    expect(result.id).toEqual(patientId);
    expect(result.catatan).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated patient to database', async () => {
    const patientId = await createTestPatient();

    const updateInput: UpdatePatientInput = {
      id: patientId,
      nama: 'Database Test Name',
      umur: 25
    };

    await updatePatient(updateInput);

    // Verify changes are persisted in database
    const patients = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, patientId))
      .execute();

    expect(patients).toHaveLength(1);
    expect(patients[0].nama).toEqual('Database Test Name');
    expect(patients[0].umur).toEqual(25);
    expect(patients[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when patient not found', async () => {
    const updateInput: UpdatePatientInput = {
      id: 999999, // Non-existent ID
      nama: 'Should Not Work'
    };

    expect(updatePatient(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update updated_at timestamp', async () => {
    const patientId = await createTestPatient();

    // Get original timestamp
    const original = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, patientId))
      .execute();

    const originalUpdatedAt = original[0].updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdatePatientInput = {
      id: patientId,
      nama: 'Timestamp Test'
    };

    const result = await updatePatient(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should handle date conversion correctly', async () => {
    const patientId = await createTestPatient();

    const testDate = new Date('2024-03-15');
    const updateInput: UpdatePatientInput = {
      id: patientId,
      tanggal_tindakan: testDate
    };

    const result = await updatePatient(updateInput);

    expect(result.tanggal_tindakan).toEqual(testDate);
    expect(result.tanggal_tindakan).toBeInstanceOf(Date);

    // Verify in database - the date column stores string but we convert it
    const patients = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, patientId))
      .execute();

    expect(patients[0].tanggal_tindakan).toEqual('2024-03-15');
  });
});
