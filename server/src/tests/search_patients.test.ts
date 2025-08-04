
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type CreatePatientInput } from '../schema';
import { searchPatients } from '../handlers/search_patients';

// Test patient inputs
const testPatients: CreatePatientInput[] = [
  {
    nama: 'John Doe',
    umur: 30,
    jenis_kelamin: 'Laki-laki',
    alamat: 'Jalan Merdeka No. 123',
    kontak: '081234567890',
    tanggal_tindakan: new Date('2024-01-15'),
    catatan: 'Regular checkup'
  },
  {
    nama: 'Jane Smith',
    umur: 25,
    jenis_kelamin: 'Perempuan',
    alamat: 'Jalan Sudirman No. 456',
    kontak: '087654321098',
    tanggal_tindakan: new Date('2024-01-20'),
    catatan: null
  },
  {
    nama: 'Ahmad Rahman',
    umur: 45,
    jenis_kelamin: 'Laki-laki',
    alamat: 'Jalan Kebon Jeruk No. 789',
    kontak: '081122334455',
    tanggal_tindakan: new Date('2024-01-25'),
    catatan: 'Follow-up visit'
  }
];

describe('searchPatients', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test patients - convert dates to strings for database insertion
    const patientsToInsert = testPatients.map(patient => ({
      ...patient,
      tanggal_tindakan: patient.tanggal_tindakan.toISOString().split('T')[0] // Convert Date to YYYY-MM-DD string
    }));
    
    await db.insert(patientsTable)
      .values(patientsToInsert)
      .execute();
  });

  afterEach(resetDB);

  it('should return empty array for empty query', async () => {
    const result = await searchPatients('');
    expect(result).toHaveLength(0);
  });

  it('should return empty array for whitespace query', async () => {
    const result = await searchPatients('   ');
    expect(result).toHaveLength(0);
  });

  it('should search patients by name (case-insensitive)', async () => {
    const result = await searchPatients('john');
    
    expect(result).toHaveLength(1);
    expect(result[0].nama).toEqual('John Doe');
    expect(result[0].umur).toEqual(30);
    expect(result[0].jenis_kelamin).toEqual('Laki-laki');
  });

  it('should search patients by partial name', async () => {
    const result = await searchPatients('Jane');
    
    expect(result).toHaveLength(1);
    expect(result[0].nama).toEqual('Jane Smith');
  });

  it('should search patients by contact number', async () => {
    const result = await searchPatients('081234567890');
    
    expect(result).toHaveLength(1);
    expect(result[0].nama).toEqual('John Doe');
    expect(result[0].kontak).toEqual('081234567890');
  });

  it('should search patients by partial contact', async () => {
    const result = await searchPatients('8765');
    
    expect(result).toHaveLength(1);
    expect(result[0].nama).toEqual('Jane Smith');
    expect(result[0].kontak).toEqual('087654321098');
  });

  it('should search patients by address', async () => {
    const result = await searchPatients('Sudirman');
    
    expect(result).toHaveLength(1);
    expect(result[0].nama).toEqual('Jane Smith');
    expect(result[0].alamat).toEqual('Jalan Sudirman No. 456');
  });

  it('should search patients by partial address (case-insensitive)', async () => {
    const result = await searchPatients('jalan');
    
    expect(result).toHaveLength(3);
    
    const names = result.map(p => p.nama).sort();
    expect(names).toEqual(['Ahmad Rahman', 'Jane Smith', 'John Doe']);
  });

  it('should return multiple results when query matches multiple patients', async () => {
    const result = await searchPatients('08');
    
    expect(result).toHaveLength(3);
    
    // All patients have contact numbers starting with '08'
    result.forEach(patient => {
      expect(patient.kontak.startsWith('08')).toBe(true);
    });
  });

  it('should return empty array for non-matching query', async () => {
    const result = await searchPatients('xyz123nonexistent');
    
    expect(result).toHaveLength(0);
  });

  it('should handle search with numbers in address', async () => {
    const result = await searchPatients('123');
    
    expect(result).toHaveLength(1);
    expect(result[0].nama).toEqual('John Doe');
    expect(result[0].alamat).toContain('123');
  });

  it('should verify all returned fields are correct', async () => {
    const result = await searchPatients('Ahmad');
    
    expect(result).toHaveLength(1);
    const patient = result[0];
    
    expect(patient.id).toBeDefined();
    expect(patient.nama).toEqual('Ahmad Rahman');
    expect(patient.umur).toEqual(45);
    expect(patient.jenis_kelamin).toEqual('Laki-laki');
    expect(patient.alamat).toEqual('Jalan Kebon Jeruk No. 789');
    expect(patient.kontak).toEqual('081122334455');
    expect(patient.tanggal_tindakan).toBeInstanceOf(Date);
    expect(patient.catatan).toEqual('Follow-up visit');
    expect(patient.created_at).toBeInstanceOf(Date);
    expect(patient.updated_at).toBeInstanceOf(Date);
  });

  it('should convert date fields correctly', async () => {
    const result = await searchPatients('John');
    
    expect(result).toHaveLength(1);
    const patient = result[0];
    
    expect(patient.tanggal_tindakan).toBeInstanceOf(Date);
    expect(patient.tanggal_tindakan.getFullYear()).toEqual(2024);
    expect(patient.tanggal_tindakan.getMonth()).toEqual(0); // January (0-indexed)
    expect(patient.tanggal_tindakan.getDate()).toEqual(15);
  });
});
