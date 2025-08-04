
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { medicationsTable } from '../db/schema';
import { type CreateMedicationInput } from '../schema';
import { getMedications } from '../handlers/get_medications';

// Test medication data
const testMedication1: CreateMedicationInput = {
  nama_obat: 'Paracetamol',
  jenis: 'Analgesik',
  stok_tersedia: 100,
  ambang_batas: 20
};

const testMedication2: CreateMedicationInput = {
  nama_obat: 'Amoxicillin',
  jenis: 'Antibiotik',
  stok_tersedia: 50,
  ambang_batas: 10
};

describe('getMedications', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no medications exist', async () => {
    const result = await getMedications();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all medications', async () => {
    // Create test medications
    await db.insert(medicationsTable)
      .values([testMedication1, testMedication2])
      .execute();

    const result = await getMedications();

    expect(result).toHaveLength(2);
    expect(result[0].nama_obat).toEqual('Paracetamol');
    expect(result[0].jenis).toEqual('Analgesik');
    expect(result[0].stok_tersedia).toEqual(100);
    expect(result[0].ambang_batas).toEqual(20);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].nama_obat).toEqual('Amoxicillin');
    expect(result[1].jenis).toEqual('Antibiotik');
    expect(result[1].stok_tersedia).toEqual(50);
    expect(result[1].ambang_batas).toEqual(10);
  });

  it('should return medications with correct data types', async () => {
    await db.insert(medicationsTable)
      .values(testMedication1)
      .execute();

    const result = await getMedications();

    expect(result).toHaveLength(1);
    const medication = result[0];
    
    // Verify data types
    expect(typeof medication.id).toBe('number');
    expect(typeof medication.nama_obat).toBe('string');
    expect(typeof medication.jenis).toBe('string');
    expect(typeof medication.stok_tersedia).toBe('number');
    expect(typeof medication.ambang_batas).toBe('number');
    expect(medication.created_at).toBeInstanceOf(Date);
    expect(medication.updated_at).toBeInstanceOf(Date);
  });

  it('should handle multiple medications with different stock levels', async () => {
    const lowStockMedication: CreateMedicationInput = {
      nama_obat: 'Insulin',
      jenis: 'Hormone',
      stok_tersedia: 5,
      ambang_batas: 15
    };

    const highStockMedication: CreateMedicationInput = {
      nama_obat: 'Vitamin C',
      jenis: 'Vitamin',
      stok_tersedia: 200,
      ambang_batas: 30
    };

    await db.insert(medicationsTable)
      .values([lowStockMedication, highStockMedication])
      .execute();

    const result = await getMedications();

    expect(result).toHaveLength(2);
    
    // Verify both medications are returned with correct stock levels
    const insulinMed = result.find(med => med.nama_obat === 'Insulin');
    const vitaminMed = result.find(med => med.nama_obat === 'Vitamin C');
    
    expect(insulinMed).toBeDefined();
    expect(insulinMed!.stok_tersedia).toEqual(5);
    expect(insulinMed!.ambang_batas).toEqual(15);
    
    expect(vitaminMed).toBeDefined();
    expect(vitaminMed!.stok_tersedia).toEqual(200);
    expect(vitaminMed!.ambang_batas).toEqual(30);
  });
});
