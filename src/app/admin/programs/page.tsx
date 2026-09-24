import { listPrograms } from "@/lib/academic-structure/programs";
import { createProgramAction } from "./actions";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, THead, Th, TBody, Tr, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { BuildingIcon } from "@/components/icons";

export default async function ProgramsPage() {
  const programs = await listPrograms();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Programs</h1>
        <p className="mt-1 text-sm text-slate-500">The three degree programs offered by the department.</p>
      </div>

      <Card>
        <CardHeader title="Add a program" />
        <CardBody>
          <form action={createProgramAction} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Name</span>
              <input
                name="name"
                required
                placeholder="BS Statistics"
                className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Code</span>
              <input
                name="code"
                required
                placeholder="STAT"
                className="w-32 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Create program
            </button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="All programs"
          description={`${programs.length} program${programs.length === 1 ? "" : "s"}`}
        />
        <CardBody>
          {programs.length === 0 ? (
            <EmptyState
              icon={<BuildingIcon />}
              title="No programs yet"
              description="Create the first degree program above."
            />
          ) : (
            <Table>
              <THead>
                <Th>Name</Th>
                <Th>Code</Th>
              </THead>
              <TBody>
                {programs.map((program) => (
                  <Tr key={program.id}>
                    <Td className="font-medium text-slate-900">{program.name}</Td>
                    <Td>{program.code}</Td>
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
