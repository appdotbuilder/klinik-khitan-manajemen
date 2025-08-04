
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { medicationsTable, usageTable } from '../db/schema';
import { getUsages } from '../handlers/get_usages';

describe('getUsages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no usage records exist', async () => {
    const result = await getUsages();
    expect(result).toEqual([]);
  });

  it('should return all usage records', async () => {
    // Create test medication first
    const medicationResult = await db.insert(medicationsTable)
      .values({
        nama_obat: 'Test Medicine',
        jenis: 'Tablet',
        stok_tersedia: 100,
        ambang_batas: 10
      })
      .returning()
      .execute();

    const medicationId = medicationResult[0].id;

    // Create test usage records
    await db.insert(usageTable)
      .values([
        {
          id_obat: medicationId,
          tanggal: '2024-01-15',
          jumlah_dipakai: 5,
          catatan: 'First usage'
        },
        {
          id_obat: medicationId,
          tanggal: '2024-01-16',
          jumlah_dipakai: 3,
          catatan: null
        }
      ])
      .execute();

    const result = await getUsages();

    expect(result).toHaveLength(2);
    
    // Verify first usage record
    expect(result[0]).toMatchObject({
      id_obat: medicationId,
      jumlah_dipakai: 5,
      catatan: 'First usage'
    });
    expect(result[0].id).toBeDefined();
    expect(result[0].tanggal).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify second usage record
    expect(result[1]).toMatchObject({
      id_obat: medicationId,
      jumlah_dipakai: 3,
      catatan: null
    });
    expect(result[1].id).toBeDefined();
    expect(result[1].tanggal).toBeInstanceOf(Date);
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should only return usage records with valid medication references', async () => {
    // Create test medication
    const medicationResult = await db.insert(medicationsTable)
      .values({
        nama_obat: 'Valid Medicine',
        jenis: 'Capsule',
        stok_tersedia: 50,
        ambang_batas: 5
      })
      .returning()
      .execute();

    const medicationId = medicationResult[0].id;

    // Create usage record with valid medication reference
    await db.insert(usageTable)
      .values({
        id_obat: medicationId,
        tanggal: '2024-01-15',
        jumlah_dipakai: 2,
        catatan: 'Valid usage'
      })
      .execute();

    const result = await getUsages();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id_obat: medicationId,
      jumlah_dipakai: 2,
      catatan: 'Valid usage'
    });
    expect(result[0].id).toBeDefined();
    expect(result[0].tanggal).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle multiple medications with usage records', async () => {
    // Create multiple medications
    const medication1 = await db.insert(medicationsTable)
      .values({
        nama_obat: 'Medicine A',
        jenis: 'Tablet',
        stok_tersedia: 100,
        ambang_batas: 10
      })
      .returning()
      .execute();

    const medication2 = await db.insert(medicationsTable)
      .values({
        nama_obat: 'Medicine B',
        jenis: 'Syrup',
        stok_tersedia: 50,
        ambang_batas: 5
      })
      .returning()
      .execute();

    // Create usage records for both medications
    await db.insert(usageTable)
      .values([
        {
          id_obat: medication1[0].id,
          tanggal: '2024-01-15',
          jumlah_dipakai: 3,
          catatan: 'Usage for Medicine A'
        },
        {
          id_obat: medication2[0].id,
          tanggal: '2024-01-16',
          jumlah_dipakai: 2,
          catatan: 'Usage for Medicine B'
        }
      ])
      .execute();

    const result = await getUsages();

    expect(result).toHaveLength(2);
    
    // Verify both usage records are returned
    const medicationAUsage = result.find(usage => usage.id_obat === medication1[0].id);
    const medicationBUsage = result.find(usage => usage.id_obat === medication2[0].id);

    expect(medicationAUsage).toBeDefined();
    expect(medicationAUsage?.jumlah_dipakai).toBe(3);
    expect(medicationAUsage?.catatan).toBe('Usage for Medicine A');

    expect(medicationBUsage).toBeDefined();
    expect(medicationBUsage?.jumlah_dipakai).toBe(2);
    expect(medicationBUsage?.catatan).toBe('Usage for Medicine B');
  });
});
