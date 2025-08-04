
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type ReportFilter, type PatientReport } from '../schema';
import { gte, lte, and, sql, count } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export const getPatientReport = async (filter: ReportFilter): Promise<PatientReport> => {
  try {
    // Build date conditions - convert Date to string for date columns
    const conditions: SQL<unknown>[] = [];
    
    if (filter.start_date) {
      conditions.push(gte(patientsTable.tanggal_tindakan, filter.start_date.toISOString().split('T')[0]));
    }
    
    if (filter.end_date) {
      conditions.push(lte(patientsTable.tanggal_tindakan, filter.end_date.toISOString().split('T')[0]));
    }

    // Get total patients count
    const totalQuery = conditions.length > 0
      ? db.select({ count: count() }).from(patientsTable).where(and(...conditions))
      : db.select({ count: count() }).from(patientsTable);
    
    const totalResult = await totalQuery.execute();
    const total_patients = totalResult[0].count;

    // Get patients by month - using extract to get year-month
    const monthlyBaseQuery = db.select({
      year: sql<number>`EXTRACT(YEAR FROM ${patientsTable.tanggal_tindakan})`,
      month: sql<number>`EXTRACT(MONTH FROM ${patientsTable.tanggal_tindakan})`,
      count: count()
    }).from(patientsTable);
    
    const monthlyQuery = conditions.length > 0
      ? monthlyBaseQuery.where(and(...conditions))
      : monthlyBaseQuery;
    
    const monthlyResults = await monthlyQuery
      .groupBy(
        sql`EXTRACT(YEAR FROM ${patientsTable.tanggal_tindakan})`,
        sql`EXTRACT(MONTH FROM ${patientsTable.tanggal_tindakan})`
      )
      .orderBy(
        sql`EXTRACT(YEAR FROM ${patientsTable.tanggal_tindakan})`,
        sql`EXTRACT(MONTH FROM ${patientsTable.tanggal_tindakan})`
      )
      .execute();

    // Format monthly data
    const patients_by_month = monthlyResults.map(result => ({
      month: `${result.year}-${result.month.toString().padStart(2, '0')}`,
      count: result.count
    }));

    // Get gender distribution
    const genderBaseQuery = db.select({
      jenis_kelamin: patientsTable.jenis_kelamin,
      count: count()
    }).from(patientsTable);
    
    const genderQuery = conditions.length > 0
      ? genderBaseQuery.where(and(...conditions))
      : genderBaseQuery;
    
    const genderResults = await genderQuery
      .groupBy(patientsTable.jenis_kelamin)
      .execute();

    // Initialize gender counts
    const patients_by_gender = {
      'Laki-laki': 0,
      'Perempuan': 0
    };

    // Populate gender counts from results
    genderResults.forEach(result => {
      if (result.jenis_kelamin === 'Laki-laki') {
        patients_by_gender['Laki-laki'] = result.count;
      } else if (result.jenis_kelamin === 'Perempuan') {
        patients_by_gender['Perempuan'] = result.count;
      }
    });

    return {
      total_patients,
      patients_by_month,
      patients_by_gender
    };
  } catch (error) {
    console.error('Patient report generation failed:', error);
    throw error;
  }
};
