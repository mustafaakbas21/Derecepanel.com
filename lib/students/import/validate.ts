import { z } from "zod";

import { MAX_IMPORT_ROWS } from "@/lib/students/import/constants";

const studyFieldSchema = z.enum(["tyt", "sayisal", "esit", "sozel", "dil"]);
const genderSchema = z.enum(["erkek", "kadin", "belirtmek_istemiyorum"]);
const parentRelationSchema = z.enum(["anne", "baba", "vasi", "diger"]);

export const studentCreateInputSchema = z.object({
  studentCode: z.string().trim().min(1, "Öğrenci No gerekli"),
  tcNo: z.string().trim().max(11).optional(),
  name: z.string().trim().min(1, "Ad Soyad zorunlu"),
  gender: genderSchema.optional(),
  birthDate: z.string().optional(),
  phone: z.string().optional(),
  sinifBranch: z.string().trim().min(1),
  alan: studyFieldSchema,
  parent: z.string().trim().min(1),
  parentPhone: z.string().trim().min(1),
  parentRelation: parentRelationSchema.optional(),
  kayitPaketi: z.string().optional(),
  goal: z.string(),
  targetUniversity: z.string().optional(),
  targetDepartment: z.string().optional(),
  status: z.literal("aktif"),
  kayitDate: z.string().min(1),
});

export const importApiRequestSchema = z.object({
  students: z
    .array(studentCreateInputSchema)
    .min(1, "En az bir öğrenci gerekli")
    .max(MAX_IMPORT_ROWS, `En fazla ${MAX_IMPORT_ROWS} satır içe aktarılabilir`),
  existingStudentCodes: z.array(z.string()),
  coachId: z.string().optional(),
});

export type StudentCreateInputValidated = z.infer<typeof studentCreateInputSchema>;
