
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createMedicationInputSchema, 
  updateMedicationInputSchema,
  createUsageInputSchema,
  createPatientInputSchema,
  updatePatientInputSchema,
  reportFilterSchema
} from './schema';

// Import handlers
import { createMedication } from './handlers/create_medication';
import { getMedications } from './handlers/get_medications';
import { updateMedication } from './handlers/update_medication';
import { deleteMedication } from './handlers/delete_medication';
import { createUsage } from './handlers/create_usage';
import { getUsages } from './handlers/get_usages';
import { createPatient } from './handlers/create_patient';
import { getPatients } from './handlers/get_patients';
import { updatePatient } from './handlers/update_patient';
import { deletePatient } from './handlers/delete_patient';
import { getDashboardSummary } from './handlers/get_dashboard_summary';
import { getLowStockMedications } from './handlers/get_low_stock_medications';
import { getUsageReport } from './handlers/get_usage_report';
import { getPatientReport } from './handlers/get_patient_report';
import { searchMedications } from './handlers/search_medications';
import { searchPatients } from './handlers/search_patients';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Medication management
  createMedication: publicProcedure
    .input(createMedicationInputSchema)
    .mutation(({ input }) => createMedication(input)),
  
  getMedications: publicProcedure
    .query(() => getMedications()),
  
  updateMedication: publicProcedure
    .input(updateMedicationInputSchema)
    .mutation(({ input }) => updateMedication(input)),
  
  deleteMedication: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteMedication(input)),

  // Usage management
  createUsage: publicProcedure
    .input(createUsageInputSchema)
    .mutation(({ input }) => createUsage(input)),
  
  getUsages: publicProcedure
    .query(() => getUsages()),

  // Patient management
  createPatient: publicProcedure
    .input(createPatientInputSchema)
    .mutation(({ input }) => createPatient(input)),
  
  getPatients: publicProcedure
    .query(() => getPatients()),
  
  updatePatient: publicProcedure
    .input(updatePatientInputSchema)
    .mutation(({ input }) => updatePatient(input)),
  
  deletePatient: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deletePatient(input)),

  // Dashboard and reports
  getDashboardSummary: publicProcedure
    .query(() => getDashboardSummary()),
  
  getLowStockMedications: publicProcedure
    .query(() => getLowStockMedications()),
  
  getUsageReport: publicProcedure
    .input(reportFilterSchema)
    .query(({ input }) => getUsageReport(input)),
  
  getPatientReport: publicProcedure
    .input(reportFilterSchema)
    .query(({ input }) => getPatientReport(input)),

  // Search functionality
  searchMedications: publicProcedure
    .input(z.string())
    .query(({ input }) => searchMedications(input)),
  
  searchPatients: publicProcedure
    .input(z.string())
    .query(({ input }) => searchPatients(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
