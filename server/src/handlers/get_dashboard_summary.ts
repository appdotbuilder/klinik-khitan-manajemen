
import { db } from '../db';
import { medicationsTable, usageTable, patientsTable } from '../db/schema';
import { type DashboardSummary } from '../schema';
import { count, lt, gte, sql } from 'drizzle-orm';

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  try {
    // Get total medications count
    const [totalMedicationsResult] = await db
      .select({ count: count() })
      .from(medicationsTable)
      .execute();

    // Get total patients count
    const [totalPatientsResult] = await db
      .select({ count: count() })
      .from(patientsTable)
      .execute();

    // Get low stock medications count (stok_tersedia < ambang_batas)
    const [lowStockCountResult] = await db
      .select({ count: count() })
      .from(medicationsTable)
      .where(lt(medicationsTable.stok_tersedia, medicationsTable.ambang_batas))
      .execute();

    // Get recent usages count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentUsagesResult] = await db
      .select({ count: count() })
      .from(usageTable)
      .where(gte(usageTable.created_at, thirtyDaysAgo))
      .execute();

    // Get list of medications with low stock
    const lowStockItems = await db
      .select()
      .from(medicationsTable)
      .where(lt(medicationsTable.stok_tersedia, medicationsTable.ambang_batas))
      .execute();

    return {
      total_medications: totalMedicationsResult.count,
      total_patients: totalPatientsResult.count,
      low_stock_medications: lowStockCountResult.count,
      recent_usages: recentUsagesResult.count,
      low_stock_items: lowStockItems
    };
  } catch (error) {
    console.error('Dashboard summary retrieval failed:', error);
    throw error;
  }
};
