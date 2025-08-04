
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { getPatients } from '../handlers/get_patients';

describe('getPatients', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no patients exist', async () => {
    const result = await getPatients();
    expect(result).toEqual([]);
  });

  it('should return all patients', async () => {
    // Insert test patients
    await db.insert(patientsTable).values([
      {
        nama: 'John Doe',
        umur: 25,
        jenis_kelamin: 'Laki-laki',
        alamat: 'Jl. Merdeka No. 1',
        kontak: '08123456789',
        tanggal_tindakan: '2024-01-15',
        catatan: 'Test patient 1'
      },
      {
        nama: 'Jane Smith',
        umur: 30,
        jenis_kelamin: 'Perempuan',
        alamat: 'Jl. Sudirman No. 5',
        kontak: '08987654321',
        tanggal_tindakan: '2024-01-20',
        catatan: null
      }
    ]).execute();

    const result = await getPatients();

    expect(result).toHaveLength(2);
    
    // Check first patient
    expect(result[0].nama).toEqual('John Doe');
    expect(result[0].umur).toEqual(25);
    expect(result[0].jenis_kelamin).toEqual('Laki-laki');
    expect(result[0].alamat).toEqual('Jl. Merdeka No. 1');
    expect(result[0].kontak).toEqual('08123456789');
    expect(result[0].tanggal_tindakan).toBeInstanceOf(Date);
    expect(result[0].tanggal_tindakan).toEqual(new Date('2024-01-15'));
    expect(result[0].catatan).toEqual('Test patient 1');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Check second patient
    expect(result[1].nama).toEqual('Jane Smith');
    expect(result[1].umur).toEqual(30);
    expect(result[1].jenis_kelamin).toEqual('Perempuan');
    expect(result[1].alamat).toEqual('Jl. Sudirman No. 5');
    expect(result[1].kontak).toEqual('08987654321');
    expect(result[1].tanggal_tindakan).toBeInstanceOf(Date);
    expect(result[1].tanggal_tindakan).toEqual(new Date('2024-01-20'));
    expect(result[1].catatan).toBeNull();
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].updated_at).toBeInstanceOf(Date);
  });

  it('should return patients in insertion order', async () => {
    // Insert test patients in specific order
    await db.insert(patientsTable).values({
      nama: 'First Patient',
      umur: 20,
      jenis_kelamin: 'Laki-laki',
      alamat: 'Address 1',
      kontak: '081234567890',
      tanggal_tindakan: '2024-01-10',
      catatan: null
    }).execute();

    await db.insert(patientsTable).values({
      nama: 'Second Patient',
      umur: 35,
      jenis_kelamin: 'Perempuan',
      alamat: 'Address 2',
      kontak: '081234567891',
      tanggal_tindakan: '2024-01-12',
      catatan: 'Second patient note'
    }).execute();

    const result = await getPatients();

    expect(result).toHaveLength(2);
    expect(result[0].nama).toEqual('First Patient');
    expect(result[0].tanggal_tindakan).toEqual(new Date('2024-01-10'));
    expect(result[1].nama).toEqual('Second Patient');
    expect(result[1].tanggal_tindakan).toEqual(new Date('2024-01-12'));
  });
});
