import { listAllClassesWithContext } from "@/lib/academic-structure/classes";
import { listAllStudents } from "@/lib/identity/students";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, THead, Th, TBody, Tr, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { UsersIcon } from "@/components/icons";
import { TableFilter } from "@/components/ui/TableFilter";
import { StudentForm } from "./student-form";

export default async function StudentsPage() {
  const [classes, students] = await Promise.all([listAllClassesWithContext(), listAllStudents()]);
  const classLabelById = new Map(
    classes.map((cls) => [cls.id, `${cls.programName} — Intake ${cls.intakeYear} ${cls.sectionType} (sem ${cls.currentSemester})`]),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Students</h1>
        <p className="mt-1 text-sm text-slate-500">
          Pick a class; the roll number is generated automatically ({"{seq}"}-{"{yy}"}). Flag a student as CR for
          their own class here.
        </p>
      </div>

      <Card>
        <CardHeader title="Add a student" description="The roll number is generated automatically for the selected class." />
        <CardBody>
          <StudentForm classes={classes.map((cls) => ({ id: cls.id, label: classLabelById.get(cls.id)! }))} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Student accounts" description={`${students.length} student${students.length === 1 ? "" : "s"}`} action={students.length > 0 ? <TableFilter tableId="students-table" label="Search students" placeholder="Search name, roll no or class" /> : undefined} />
        <CardBody>
          {students.length === 0 ? (
            <EmptyState
              icon={<UsersIcon className="h-9 w-9" />}
              title="No students yet"
              description="Student accounts you create will show up here."
            />
          ) : (
            <Table id="students-table">
              <THead>
                <Th>Roll No</Th>
                <Th>Name</Th>
                <Th>Class</Th>
                <Th>Role</Th>
              </THead>
              <TBody>
                {students.map((student) => (
                  <Tr key={student.userId}>
                    <Td className="font-medium text-slate-900">{student.rollNumber}</Td>
                    <Td>{student.fullName}</Td>
                    <Td>{classLabelById.get(student.classId) ?? "Unknown class"}</Td>
                    <Td>{student.isClassRep && <Badge tone="brand">CR</Badge>}</Td>
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
