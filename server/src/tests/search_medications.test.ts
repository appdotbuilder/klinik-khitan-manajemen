
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { medicationsTable } from '../db/schema';
import { type CreateMedicationInput } from '../schema';
import { searchMedications } from '../handlers/search_medications';

const testMedications: CreateMedicationInput[] = [
  {
    nama_obat: 'Paracetamol',
    jenis: 'Analgesik',
    stok_tersedia: 100,
    ambang_batas: 20
  },
  {
    nama_obat: 'Amoxicillin',
    jenis: 'Antibiotik',
    stok_tersedia: 50,
    ambang_batas: 10
  },
  {
    nama_obat: 'Ibuprofen',
    jenis: 'Analgesik',
    stok_tersedia: 75,
    ambang_batas: 15
  },
  {
    nama_obat: 'Cetirizine',
    jenis: 'Antihistamin',
    stok_tersedia: 30,
    ambang_batas: 5
  }
];

describe('searchMedications', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  beforeEach(async () => {
    // Insert test medications
    await db.insert(medicationsTable).values(testMedications).execute();
  });

  it('should search medications by nama_obat', async () => {
    const results = await searchMedications('Paracetamol');

    expect(results).toHaveLength(1);
    expect(results[0].nama_obat).toEqual('Paracetamol');
    expect(results[0].jenis).toEqual('Analgesik');
    expect(results[0].stok_tersedia).toEqual(100);
    expect(results[0].ambang_batas).toEqual(20);
    expect(results[0].id).toBeDefined();
    expect(results[0].created_at).toBeInstanceOf(Date);
    expect(results[0].updated_at).toBeInstanceOf(Date);
  });

  it('should search medications by jenis', async () => {
    const results = await searchMedications('Analgesik');

    expect(results).toHaveLength(2);
    expect(results.map(r => r.nama_obat).sort()).toEqual(['Ibuprofen', 'Paracetamol']);
    results.forEach(result => {
      expect(result.jenis).toEqual('Analgesik');
    });
  });

  it('should perform case-insensitive search on nama_obat', async () => {
    const results = await searchMedications('PARACETAMOL');

    expect(results).toHaveLength(1);
    expect(results[0].nama_obat).toEqual('Paracetamol');
  });

  it('should perform case-insensitive search on jenis', async () => {
    const results = await searchMedications('antibiotik');

    expect(results).toHaveLength(1);
    expect(results[0].nama_obat).toEqual('Amoxicillin');
    expect(results[0].jenis).toEqual('Antibiotik');
  });

  it('should perform partial matching on nama_obat', async () => {
    const results = await searchMedications('Amox');

    expect(results).toHaveLength(1);
    expect(results[0].nama_obat).toEqual('Amoxicillin');
  });

  it('should perform partial matching on jenis', async () => {
    const results = await searchMedications('Anti');

    expect(results).toHaveLength(2);
    const names = results.map(r => r.nama_obat).sort();
    expect(names).toEqual(['Amoxicillin', 'Cetirizine']);
  });

  it('should return empty array for no matches', async () => {
    const results = await searchMedications('NonexistentMedication');

    expect(results).toHaveLength(0);
  });

  it('should return empty array for empty query', async () => {
    const results = await searchMedications('');

    expect(results).toHaveLength(4);
  });

  it('should match across both nama_obat and jenis fields', async () => {
    const results = await searchMedications('rizine');

    // Should match 'Cetirizine' in nama_obat (unique substring)
    expect(results).toHaveLength(1);
    expect(results[0].nama_obat).toEqual('Cetirizine');
    expect(results[0].jenis).toEqual('Antihistamin');
  });
});
