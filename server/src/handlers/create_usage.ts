
import { db } from '../db';
import { usageTable, medicationsTable } from '../db/schema';
import { type CreateUsageInput, type Usage } from '../schema';
import { eq } from 'drizzle-orm';

export const createUsage = async (input: CreateUsageInput): Promise<Usage> => {
  try {
    // First, verify medication exists and has sufficient stock
    const medication = await db.select()
      .from(medicationsTable)
      .where(eq(medicationsTable.id, input.id_obat))
      .execute();

    if (medication.length === 0) {
      throw new Error(`Medication with ID ${input.id_obat} not found`);
    }

    const currentStock = medication[0].stok_tersedia;
    if (currentStock < input.jumlah_dipakai) {
      throw new Error(`Insufficient stock. Available: ${currentStock}, Requested: ${input.jumlah_dipakai}`);
    }

    // Create usage record
    const usageResult = await db.insert(usageTable)
      .values({
        id_obat: input.id_obat,
        tanggal: input.tanggal.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        jumlah_dipakai: input.jumlah_dipakai,
        catatan: input.catatan
      })
      .returning()
      .execute();

    // Update medication stock
    await db.update(medicationsTable)
      .set({ 
        stok_tersedia: currentStock - input.jumlah_dipakai,
        updated_at: new Date()
      })
      .where(eq(medicationsTable.id, input.id_obat))
      .execute();

    const usage = usageResult[0];
    return {
      ...usage,
      tanggal: new Date(usage.tanggal) // Convert string back to Date
    };
  } catch (error) {
    console.error('Usage creation failed:', error);
    throw error;
  }
};
