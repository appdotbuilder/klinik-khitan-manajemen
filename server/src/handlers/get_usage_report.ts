
import { db } from '../db';
import { usageTable, medicationsTable } from '../db/schema';
import { type ReportFilter, type UsageReport } from '../schema';
import { eq, gte, lte, and, sum, count, min, max, desc } from 'drizzle-orm';
import { SQL } from 'drizzle-orm';

export const getUsageReport = async (filter: ReportFilter): Promise<UsageReport[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filter.start_date) {
      // Convert Date to string format for date comparison
      const startDateStr = filter.start_date.toISOString().split('T')[0];
      conditions.push(gte(usageTable.tanggal, startDateStr));
    }

    if (filter.end_date) {
      // Convert Date to string format for date comparison
      const endDateStr = filter.end_date.toISOString().split('T')[0];
      conditions.push(lte(usageTable.tanggal, endDateStr));
    }

    if (filter.medication_id) {
      conditions.push(eq(usageTable.id_obat, filter.medication_id));
    }

    // Build the complete query based on whether we have conditions or not
    const baseQuery = db.select({
      medication_name: medicationsTable.nama_obat,
      total_used: sum(usageTable.jumlah_dipakai).as('total_used'),
      usage_count: count(usageTable.id).as('usage_count'),
      min_date: min(usageTable.tanggal).as('min_date'),
      max_date: max(usageTable.tanggal).as('max_date')
    })
    .from(usageTable)
    .innerJoin(medicationsTable, eq(usageTable.id_obat, medicationsTable.id));

    // Execute the query with or without conditions
    const results = conditions.length > 0
      ? await baseQuery
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .groupBy(medicationsTable.id, medicationsTable.nama_obat)
          .orderBy(desc(sum(usageTable.jumlah_dipakai)))
          .execute()
      : await baseQuery
          .groupBy(medicationsTable.id, medicationsTable.nama_obat)
          .orderBy(desc(sum(usageTable.jumlah_dipakai)))
          .execute();

    // Transform results to match UsageReport schema
    return results.map(result => ({
      medication_name: result.medication_name,
      total_used: Number(result.total_used) || 0,
      usage_count: Number(result.usage_count) || 0,
      date_range: {
        start: result.min_date ? new Date(result.min_date) : new Date(),
        end: result.max_date ? new Date(result.max_date) : new Date()
      }
    }));
  } catch (error) {
    console.error('Usage report generation failed:', error);
    throw error;
  }
};
