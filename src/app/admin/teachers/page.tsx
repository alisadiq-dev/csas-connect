import { listTeachers } from "@/lib/identity/teachers";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, THead, Th, TBody, Tr, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { UserIcon } from "@/components/icons";
import { TeacherForm } from "./teacher-form";

export default async function TeachersPage() {
  const teachers = await listTeachers();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Teachers</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create a teacher account (email + password); they can sign in immediately. Assign them to course
          offerings from the Offerings page.
        </p>
      </div>

      <Card>
        <CardHeader title="Add a teacher" description="They can sign in immediately with the email and password below." />
        <CardBody>
          <TeacherForm />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Faculty accounts" description={`${teachers.length} teacher${teachers.length === 1 ? "" : "s"}`} />
        <CardBody>
          {teachers.length === 0 ? (
            <EmptyState
              icon={<UserIcon className="h-9 w-9" />}
              title="No teachers yet"
              description="Teacher accounts you create will show up here."
            />
          ) : (
            <Table>
              <THead>
                <Th>Name</Th>
              </THead>
              <TBody>
                {teachers.map((teacher) => (
                  <Tr key={teacher.userId}>
                    <Td className="font-medium text-slate-900">{teacher.fullName}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
