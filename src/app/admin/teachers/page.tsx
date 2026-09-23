import { listTeachers } from "@/lib/identity/teachers";
import { TeacherForm } from "./teacher-form";

export default async function TeachersPage() {
  const teachers = await listTeachers();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Teachers</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Create a teacher account (email + password); they can sign in immediately. Assign them to course
          offerings from the Offerings page.
        </p>
      </div>

      <TeacherForm />

      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
        {teachers.length === 0 && <li className="p-4 text-sm text-zinc-500">No teachers yet.</li>}
        {teachers.map((teacher) => (
          <li key={teacher.userId} className="p-4 text-sm text-zinc-900 dark:text-zinc-50">
            {teacher.fullName}
          </li>
        ))}
      </ul>
    </div>
  );
}
