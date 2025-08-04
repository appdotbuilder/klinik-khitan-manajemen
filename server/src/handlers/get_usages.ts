
import { db } from '../db';
import { usageTable, medicationsTable } from '../db/schema';
import { type Usage } from '../schema';
import { eq } from 'drizzle-orm';

export const getUsages = async (): Promise<Usage[]> => {
  try {
    // Query usage records with medication details joined
    const results = await db.select()
      .from(usageTable)
      .innerJoin(medicationsTable, eq(usageTable.id_obat, medicationsTable.id))
      .execute();

    // Map joined results to Usage schema format
    return results.map(result => ({
      id: result.usage.id,
      id_obat: result.usage.id_obat,
      tanggal: new Date(result.usage.tanggal), // Convert string date to Date object
      jumlah_dipakai: result.usage.jumlah_dipakai,
      catatan: result.usage.catatan,
      created_at: result.usage.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch usage records:', error);
    throw error;
  }
};
