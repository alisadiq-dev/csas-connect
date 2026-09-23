// Seeds demo login-capable accounts (via the local auth.users shim, not a
// real Supabase signup — see scripts/local-auth-shim.sql) for every role:
// one admin, a small pool of teachers per program (assigned round-robin
// across that program's course offerings, so every offering ends up with a
// teacher — a handful of teachers each covering several offerings is more
// realistic than one distinct teacher per offering), and a handful of
// students per seeded class (24 classes), including at least one Class
// Representative per class.
//
// Must run after `npm run db:seed` (academic-structure). Relative imports
// (not `@/`) so it runs directly under Node's native TypeScript support.

import { eq, inArray } from "drizzle-orm";
import { db } from "../../src/db/index.ts";
import { batches, classes, courseOfferings, programs } from "../../src/db/schema/academic-structure.ts";
import { adminProfiles, studentProfiles, teacherProfiles } from "../../src/db/schema/identity.ts";
import { createAuthUser } from "../../src/lib/identity/auth.ts";
import { generateRollNumber } from "../../src/lib/identity/roll-number.ts";

const FIRST_NAMES = [
  "Ahmed", "Ali", "Hassan", "Usman", "Bilal", "Hamza", "Zeeshan", "Faisal", "Imran", "Tariq",
  "Ayesha", "Fatima", "Sana", "Mahnoor", "Zainab", "Hira", "Rabia", "Amna", "Sadia", "Nida",
  "Kamran", "Waqas", "Asad", "Junaid", "Saad", "Noman", "Adeel", "Shahzaib", "Talha", "Umar",
  "Mariam", "Aliza", "Iqra", "Komal", "Laiba", "Anum", "Saba", "Warda", "Mehak", "Noor",
];
const LAST_NAMES = [
  "Khan", "Malik", "Butt", "Chaudhry", "Sheikh", "Raza", "Iqbal", "Farooq", "Javed", "Aslam",
  "Qureshi", "Abbasi", "Rana", "Mirza", "Siddiqui", "Hashmi", "Baig", "Awan", "Gill", "Sultan",
];

function randomFrom<T>(arr: T[], seedIndex: number): T {
  return arr[seedIndex % arr.length];
}

function nameFor(seedIndex: number): string {
  // Deterministic (not Math.random()) so a re-run of a dry check produces
  // the same names — nicer for reviewing seeded data.
  const first = randomFrom(FIRST_NAMES, seedIndex);
  const last = randomFrom(LAST_NAMES, seedIndex * 7 + 3);
  return `${first} ${last}`;
}

async function main() {
  const existingAdmins = await db.select().from(adminProfiles);
  if (existingAdmins.length > 0) {
    console.log("identity already seeded (admin account found) — skipping.");
    return;
  }

  const allPrograms = await db.select().from(programs);
  if (allPrograms.length === 0) {
    throw new Error("No programs found — run `npm run db:seed` (academic-structure) first.");
  }

  // --- Admin ---
  const admin = await createAuthUser({ email: "admin@csas-connect.local", password: "AdminPass123!" });
  await db.insert(adminProfiles).values({ userId: admin.userId, fullName: "Department Administrator" });
  console.log("Created 1 admin account (admin@csas-connect.local / AdminPass123!).");

  // --- Teachers: a small pool per program, assigned round-robin across
  // that program's course offerings ---
  const TEACHERS_PER_PROGRAM = 4;
  let teacherSeedIndex = 0;
  let totalTeachers = 0;
  let totalOfferingsAssigned = 0;
  const firstTeacherIdByProgram = new Map<string, string>();

  for (const program of allPrograms) {
    const programTeacherIds: string[] = [];
    for (let i = 0; i < TEACHERS_PER_PROGRAM; i++) {
      const fullName = `Dr. ${nameFor(teacherSeedIndex)}`;
      const email = `teacher.${program.code.toLowerCase()}.${i + 1}@csas-connect.local`;
      const { userId } = await createAuthUser({ email, password: "TeacherPass123!" });
      await db.insert(teacherProfiles).values({ userId, fullName });
      programTeacherIds.push(userId);
      teacherSeedIndex++;
      totalTeachers++;
    }
    firstTeacherIdByProgram.set(program.id, programTeacherIds[0]);

    // All offerings for classes belonging to this program.
    const programClasses = await db
      .select({ id: classes.id })
      .from(classes)
      .innerJoin(batches, eq(classes.batchId, batches.id))
      .where(eq(batches.programId, program.id));

    const classIds = programClasses.map((c) => c.id);
    if (classIds.length === 0) continue;

    const offeringsForProgram = await db
      .select({ id: courseOfferings.id })
      .from(courseOfferings)
      .where(inArray(courseOfferings.classId, classIds));

    for (let i = 0; i < offeringsForProgram.length; i++) {
      const teacherId = programTeacherIds[i % programTeacherIds.length];
      await db
        .update(courseOfferings)
        .set({ teacherId })
        .where(eq(courseOfferings.id, offeringsForProgram[i].id));
      totalOfferingsAssigned++;
    }
  }
  console.log(`Created ${totalTeachers} teacher accounts; assigned teachers to ${totalOfferingsAssigned} course offerings.`);

  // --- Cross-program teacher (Task 35's demo requirement): assign the
  // first program's first teacher to one additional offering in the SECOND
  // program too, so at least one seeded teacher account genuinely has
  // course offerings in more than one program — the per-program round-robin
  // above never produces this on its own (each pool is scoped to a single
  // program), and SPEC-timetable.md's teacher view ("aggregated schedule
  // across all their course offerings, regardless of program") needs at
  // least one real example to demo. Doesn't affect the round-robin's own
  // per-program coverage guarantee (that offering keeps a valid teacher —
  // it's simply reassigned to a second one).
  if (allPrograms.length >= 2) {
    const crossTeacherId = firstTeacherIdByProgram.get(allPrograms[0].id);
    const secondProgram = allPrograms[1];
    const secondProgramClasses = await db
      .select({ id: classes.id })
      .from(classes)
      .innerJoin(batches, eq(classes.batchId, batches.id))
      .where(eq(batches.programId, secondProgram.id));
    const secondProgramClassIds = secondProgramClasses.map((c) => c.id);
    if (crossTeacherId && secondProgramClassIds.length > 0) {
      const [targetOffering] = await db
        .select({ id: courseOfferings.id })
        .from(courseOfferings)
        .where(inArray(courseOfferings.classId, secondProgramClassIds))
        .limit(1);
      if (targetOffering) {
        await db.update(courseOfferings).set({ teacherId: crossTeacherId }).where(eq(courseOfferings.id, targetOffering.id));
        console.log(`Assigned a cross-program teacher: one ${secondProgram.code} offering now belongs to a ${allPrograms[0].code} teacher, for the aggregated teacher timetable demo.`);
      }
    }
  }

  // --- Students: a handful per class, first one flagged as CR ---
  const STUDENTS_PER_CLASS = 4;
  const allClasses = await db.select().from(classes);
  let studentSeedIndex = 0;
  let totalStudents = 0;
  let totalCRs = 0;

  for (const cls of allClasses) {
    for (let i = 0; i < STUDENTS_PER_CLASS; i++) {
      const fullName = nameFor(studentSeedIndex);
      const rollNumber = await generateRollNumber(cls.id);
      const email = `student.${rollNumber.replace(/[^0-9a-z]/gi, "-")}.${cls.id.slice(0, 8)}@csas-connect.local`;
      const { userId } = await createAuthUser({ email, password: "StudentPass123!" });
      const isClassRep = i === 0;
      await db.insert(studentProfiles).values({ userId, fullName, rollNumber, classId: cls.id, isClassRep });
      studentSeedIndex++;
      totalStudents++;
      if (isClassRep) totalCRs++;
    }
  }
  console.log(`Created ${totalStudents} student accounts across ${allClasses.length} classes (${totalCRs} class representatives).`);

  console.log("identity seed complete.");
  console.log("Demo credentials: admin@csas-connect.local / AdminPass123!, teacher.<program-code>.<n>@csas-connect.local / TeacherPass123!, student emails printed above pattern / StudentPass123!.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
