
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { medicationsTable } from '../db/schema';
import { type CreateMedicationInput } from '../schema';
import { createMedication } from '../handlers/create_medication';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateMedicationInput = {
  nama_obat: 'Paracetamol',
  jenis: 'Tablet',
  stok_tersedia: 100,
  ambang_batas: 20
};

describe('createMedication', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a medication', async () => {
    const result = await createMedication(testInput);

    // Basic field validation
    expect(result.nama_obat).toEqual('Paracetamol');
    expect(result.jenis).toEqual('Tablet');
    expect(result.stok_tersedia).toEqual(100);
    expect(result.ambang_batas).toEqual(20);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save medication to database', async () => {
    const result = await createMedication(testInput);

    // Query using proper drizzle syntax
    const medications = await db.select()
      .from(medicationsTable)
      .where(eq(medicationsTable.id, result.id))
      .execute();

    expect(medications).toHaveLength(1);
    expect(medications[0].nama_obat).toEqual('Paracetamol');
    expect(medications[0].jenis).toEqual('Tablet');
    expect(medications[0].stok_tersedia).toEqual(100);
    expect(medications[0].ambang_batas).toEqual(20);
    expect(medications[0].created_at).toBeInstanceOf(Date);
    expect(medications[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create medication with zero stock and threshold', async () => {
    const zeroStockInput: CreateMedicationInput = {
      nama_obat: 'Out of Stock Medicine',
      jenis: 'Syrup',
      stok_tersedia: 0,
      ambang_batas: 0
    };

    const result = await createMedication(zeroStockInput);

    expect(result.nama_obat).toEqual('Out of Stock Medicine');
    expect(result.jenis).toEqual('Syrup');
    expect(result.stok_tersedia).toEqual(0);
    expect(result.ambang_batas).toEqual(0);
    expect(result.id).toBeDefined();
  });

  it('should handle different medication types', async () => {
    const capsuleInput: CreateMedicationInput = {
      nama_obat: 'Vitamin C',
      jenis: 'Kapsul',
      stok_tersedia: 50,
      ambang_batas: 10
    };

    const result = await createMedication(capsuleInput);

    expect(result.nama_obat).toEqual('Vitamin C');
    expect(result.jenis).toEqual('Kapsul');
    expect(result.stok_tersedia).toEqual(50);
    expect(result.ambang_batas).toEqual(10);
  });
});
