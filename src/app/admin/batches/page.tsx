import { listPrograms } from "@/lib/academic-structure/programs";
import { listBatchesForProgram } from "@/lib/academic-structure/batches";
import { listClassesForBatch } from "@/lib/academic-structure/classes";
import { createBatchAction } from "./actions";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, THead, Th, TBody, Tr, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { LayersIcon } from "@/components/icons";

export default async function BatchesPage() {
  const programs = await listPrograms();
  const programsWithBatches = await Promise.all(
    programs.map(async (program) => {
      const batches = await listBatchesForProgram(program.id);
      const batchesWithClasses = await Promise.all(
        batches.map(async (batch) => ({
          batch,
          classes: await listClassesForBatch(batch.id),
        })),
      );
      return { program, batchesWithClasses };
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Batches &amp; Classes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Creating a batch automatically generates its Regular and Replica classes.
        </p>
      </div>

      <Card>
        <CardHeader title="Add a batch" />
        <CardBody>
          <form action={createBatchAction} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Program</span>
              <select
                name="programId"
                required
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:w-56"
              >
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Intake year</span>
              <input
                name="intakeYear"
                type="number"
                required
                placeholder="2024"
                className="w-28 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Current semester</span>
              <input
                name="currentSemester"
                type="number"
                min={1}
                max={8}
                defaultValue={1}
                required
                className="w-24 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Create batch (+ classes)
            </button>
          </form>
        </CardBody>
      </Card>

      <div className="flex flex-col gap-6">
        {programsWithBatches.map(({ program, batchesWithClasses }) => (
          <Card key={program.id}>
            <CardHeader
              title={program.name}
              description={`${batchesWithClasses.length} batch${batchesWithClasses.length === 1 ? "" : "es"}`}
            />
            <CardBody>
              {batchesWithClasses.length === 0 ? (
                <EmptyState
                  icon={<LayersIcon />}
                  title="No batches yet"
                  description="Create the first batch for this program above."
                />
              ) : (
                <Table>
                  <THead>
                    <Th>Intake</Th>
                    <Th>Semester</Th>
                    <Th>Classes</Th>
                  </THead>
                  <TBody>
                    {batchesWithClasses.map(({ batch, classes }) => (
                      <Tr key={batch.id}>
                        <Td className="font-medium text-slate-900">Intake {batch.intakeYear}</Td>
                        <Td>Semester {classes[0]?.currentSemester ?? "?"}</Td>
                        <Td>
                          <span className="flex flex-wrap gap-1.5">
                            {classes.map((cls) => (
                              <Badge
                                key={cls.id}
                                tone={cls.sectionType === "regular" ? "brand" : "info"}
                                className="capitalize"
                              >
                                {cls.sectionType}
                              </Badge>
                            ))}
                          </span>
                        </Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
