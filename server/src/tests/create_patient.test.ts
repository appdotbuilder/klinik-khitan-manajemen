
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type CreatePatientInput } from '../schema';
import { createPatient } from '../handlers/create_patient';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreatePatientInput = {
  nama: 'John Doe',
  umur: 35,
  jenis_kelamin: 'Laki-laki',
  alamat: 'Jl. Merdeka No. 123, Jakarta',
  kontak: '081234567890',
  tanggal_tindakan: new Date('2024-01-15'),
  catatan: 'Pasien rujukan dari puskesmas'
};

describe('createPatient', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a patient with all fields', async () => {
    const result = await createPatient(testInput);

    // Basic field validation
    expect(result.nama).toEqual('John Doe');
    expect(result.umur).toEqual(35);
    expect(result.jenis_kelamin).toEqual('Laki-laki');
    expect(result.alamat).toEqual('Jl. Merdeka No. 123, Jakarta');
    expect(result.kontak).toEqual('081234567890');
    expect(result.tanggal_tindakan).toEqual(new Date('2024-01-15'));
    expect(result.catatan).toEqual('Pasien rujukan dari puskesmas');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a patient with null catatan', async () => {
    const inputWithNullCatatan: CreatePatientInput = {
      ...testInput,
      catatan: null
    };

    const result = await createPatient(inputWithNullCatatan);

    expect(result.nama).toEqual('John Doe');
    expect(result.catatan).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should create a female patient', async () => {
    const femalePatientInput: CreatePatientInput = {
      ...testInput,
      nama: 'Jane Doe',
      jenis_kelamin: 'Perempuan'
    };

    const result = await createPatient(femalePatientInput);

    expect(result.nama).toEqual('Jane Doe');
    expect(result.jenis_kelamin).toEqual('Perempuan');
    expect(result.id).toBeDefined();
  });

  it('should save patient to database', async () => {
    const result = await createPatient(testInput);

    // Query using proper drizzle syntax
    const patients = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, result.id))
      .execute();

    expect(patients).toHaveLength(1);
    expect(patients[0].nama).toEqual('John Doe');
    expect(patients[0].umur).toEqual(35);
    expect(patients[0].jenis_kelamin).toEqual('Laki-laki');
    expect(patients[0].alamat).toEqual('Jl. Merdeka No. 123, Jakarta');
    expect(patients[0].kontak).toEqual('081234567890');
    expect(new Date(patients[0].tanggal_tindakan)).toEqual(new Date('2024-01-15'));
    expect(patients[0].catatan).toEqual('Pasien rujukan dari puskesmas');
    expect(patients[0].created_at).toBeInstanceOf(Date);
    expect(patients[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple patients with different ages', async () => {
    const youngPatient: CreatePatientInput = {
      ...testInput,
      nama: 'Young Patient',
      umur: 18
    };

    const oldPatient: CreatePatientInput = {
      ...testInput,
      nama: 'Old Patient',
      umur: 75
    };

    const result1 = await createPatient(youngPatient);
    const result2 = await createPatient(oldPatient);

    expect(result1.nama).toEqual('Young Patient');
    expect(result1.umur).toEqual(18);
    expect(result2.nama).toEqual('Old Patient');
    expect(result2.umur).toEqual(75);

    // Verify both are saved to database
    const allPatients = await db.select()
      .from(patientsTable)
      .execute();

    expect(allPatients).toHaveLength(2);
  });
});
