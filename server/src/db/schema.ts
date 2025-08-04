
import { serial, text, pgTable, timestamp, integer, pgEnum, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for gender
export const genderEnum = pgEnum('gender', ['Laki-laki', 'Perempuan']);

// Medications table
export const medicationsTable = pgTable('medications', {
  id: serial('id').primaryKey(),
  nama_obat: text('nama_obat').notNull(),
  jenis: text('jenis').notNull(),
  stok_tersedia: integer('stok_tersedia').notNull(),
  ambang_batas: integer('ambang_batas').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Usage table
export const usageTable = pgTable('usage', {
  id: serial('id').primaryKey(),
  id_obat: integer('id_obat').notNull().references(() => medicationsTable.id),
  tanggal: date('tanggal').notNull(),
  jumlah_dipakai: integer('jumlah_dipakai').notNull(),
  catatan: text('catatan'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Patients table
export const patientsTable = pgTable('patients', {
  id: serial('id').primaryKey(),
  nama: text('nama').notNull(),
  umur: integer('umur').notNull(),
  jenis_kelamin: genderEnum('jenis_kelamin').notNull(),
  alamat: text('alamat').notNull(),
  kontak: text('kontak').notNull(),
  tanggal_tindakan: date('tanggal_tindakan').notNull(),
  catatan: text('catatan'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const medicationsRelations = relations(medicationsTable, ({ many }) => ({
  usages: many(usageTable),
}));

export const usageRelations = relations(usageTable, ({ one }) => ({
  medication: one(medicationsTable, {
    fields: [usageTable.id_obat],
    references: [medicationsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Medication = typeof medicationsTable.$inferSelect;
export type NewMedication = typeof medicationsTable.$inferInsert;
export type Usage = typeof usageTable.$inferSelect;
export type NewUsage = typeof usageTable.$inferInsert;
export type Patient = typeof patientsTable.$inferSelect;
export type NewPatient = typeof patientsTable.$inferInsert;

// Export all tables for proper query building
export const tables = { 
  medications: medicationsTable, 
  usage: usageTable, 
  patients: patientsTable 
};
