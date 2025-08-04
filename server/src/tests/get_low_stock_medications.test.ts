
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { medicationsTable } from '../db/schema';
import { type CreateMedicationInput } from '../schema';
import { getLowStockMedications } from '../handlers/get_low_stock_medications';

// Test medications data
const highStockMedication: CreateMedicationInput = {
  nama_obat: 'Paracetamol',
  jenis: 'Tablet',
  stok_tersedia: 100,
  ambang_batas: 20
};

const lowStockMedication: CreateMedicationInput = {
  nama_obat: 'Aspirin',
  jenis: 'Tablet',
  stok_tersedia: 15,
  ambang_batas: 20
};

const criticalStockMedication: CreateMedicationInput = {
  nama_obat: 'Ibuprofen',
  jenis: 'Kapsul',
  stok_tersedia: 5,
  ambang_batas: 10
};

const equalStockMedication: CreateMedicationInput = {
  nama_obat: 'Amoxicillin',
  jenis: 'Sirup',
  stok_tersedia: 25,
  ambang_batas: 25
};

describe('getLowStockMedications', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return medications with stock below threshold', async () => {
    // Create test medications
    await db.insert(medicationsTable).values([
      highStockMedication,
      lowStockMedication,
      criticalStockMedication
    ]).execute();

    const result = await getLowStockMedications();

    // Should return only low stock medications
    expect(result).toHaveLength(2);
    
    const medicationNames = result.map(med => med.nama_obat);
    expect(medicationNames).toContain('Aspirin');
    expect(medicationNames).toContain('Ibuprofen');
    expect(medicationNames).not.toContain('Paracetamol');
  });

  it('should return medications with stock equal to threshold', async () => {
    // Create medication with stock exactly equal to threshold
    await db.insert(medicationsTable).values([
      highStockMedication,
      equalStockMedication
    ]).execute();

    const result = await getLowStockMedications();

    // Should return medication with equal stock
    expect(result).toHaveLength(1);
    expect(result[0].nama_obat).toEqual('Amoxicillin');
    expect(result[0].stok_tersedia).toEqual(25);
    expect(result[0].ambang_batas).toEqual(25);
  });

  it('should return empty array when no medications have low stock', async () => {
    // Create only high stock medications
    await db.insert(medicationsTable).values([
      highStockMedication,
      {
        nama_obat: 'Vitamin C',
        jenis: 'Tablet',
        stok_tersedia: 50,
        ambang_batas: 30
      }
    ]).execute();

    const result = await getLowStockMedications();

    expect(result).toHaveLength(0);
  });

  it('should return correct medication properties', async () => {
    // Create one low stock medication
    await db.insert(medicationsTable).values([lowStockMedication]).execute();

    const result = await getLowStockMedications();

    expect(result).toHaveLength(1);
    const medication = result[0];
    
    // Verify all required fields are present
    expect(medication.id).toBeDefined();
    expect(medication.nama_obat).toEqual('Aspirin');
    expect(medication.jenis).toEqual('Tablet');
    expect(medication.stok_tersedia).toEqual(15);
    expect(medication.ambang_batas).toEqual(20);
    expect(medication.created_at).toBeInstanceOf(Date);
    expect(medication.updated_at).toBeInstanceOf(Date);
  });

  it('should handle multiple low stock medications correctly', async () => {
    // Create multiple medications with varying stock levels
    await db.insert(medicationsTable).values([
      lowStockMedication,
      criticalStockMedication,
      equalStockMedication,
      highStockMedication,
      {
        nama_obat: 'Cough Syrup',
        jenis: 'Sirup',
        stok_tersedia: 0,
        ambang_batas: 5
      }
    ]).execute();

    const result = await getLowStockMedications();

    // Should return 4 medications (low, critical, equal, and zero stock)
    expect(result).toHaveLength(4);
    
    // Verify they are all actually low stock
    result.forEach(medication => {
      expect(medication.stok_tersedia).toBeLessThanOrEqual(medication.ambang_batas);
    });
  });
});
