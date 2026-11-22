import { prisma } from "@/lib/db";
import {
  DEFAULT_EMAIL,
  DEFAULT_HEADLINE,
  PROFILE_TEXT_FIELDS,
  type Localized,
  type ProfileInput,
  type ProfileTextField,
  type ProjectInput,
} from "@/lib/aboutContent";
import { neighborToSwap, planTranslationReset, translationWrite } from "@/lib/aboutPlan";
import { translateZhText } from "@/lib/translateThought";

const PROFILE_ID = "default";
const PROJECT_TEXT_FIELDS = ["name", "description"] as const;

export type AboutProfileView = Record<ProfileTextField, Localized> & { email: string };
export type ProjectView = {
  id: string;
  name: Localized;
  description: Localized;
  url: string;
  domain: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isVisible: boolean;
};

type TextRow = Record<string, unknown>;

function localized(row: TextRow, field: string): Localized {
  return {
    zh: (row[field] as string | null) ?? "",
    en: (row[`${field}En`] as string | null) ?? null,
    fr: (row[`${field}Fr`] as string | null) ?? null,
  };
}

function profileView(row: TextRow & { email: string }): AboutProfileView {
  const view = { email: row.email } as AboutProfileView;
  for (const field of PROFILE_TEXT_FIELDS) view[field] = localized(row, field);
  return view;
}

function projectView(row: TextRow & {
  id: string;
  url: string;
  domain: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isVisible: boolean;
}): ProjectView {
  return {
    id: row.id,
    name: localized(row, "name"),
    description: localized(row, "description"),
    url: row.url,
    domain: row.domain,
    imageUrl: row.imageUrl,
    sortOrder: row.sortOrder,
    isVisible: row.isVisible,
  };
}

function clearedTranslations(fields: readonly string[]): Record<string, null> {
  const data: Record<string, null> = {};
  for (const field of fields) {
    data[`${field}En`] = null;
    data[`${field}Fr`] = null;
  }
  return data;
}

/** 逐个字段翻译并写回；失败只打日志，不影响已保存的中文 */
async function translateFields<F extends string>(
  id: string,
  fields: readonly F[],
  source: Record<F, string>,
  write: (args: ReturnType<typeof translationWrite>) => Promise<unknown>
): Promise<void> {
  for (const field of fields) {
    const zh = source[field];
    if (!zh) continue;
    try {
      const tr = await translateZhText(zh);
      if (!tr) return;
      await write(translationWrite(id, field, zh, tr));
    } catch (e) {
      console.error("[about translate]", field, e);
    }
  }
}

export async function getAboutProfile(): Promise<AboutProfileView> {
  const row = await prisma.aboutProfile.findUnique({ where: { id: PROFILE_ID } });
  if (row) return profileView(row);
  return profileView({ headline: DEFAULT_HEADLINE, email: DEFAULT_EMAIL });
}

export async function saveAboutProfile(input: ProfileInput): Promise<AboutProfileView> {
  const existing = await prisma.aboutProfile.findUnique({ where: { id: PROFILE_ID } });
  const previous = Object.fromEntries(
    PROFILE_TEXT_FIELDS.map((field) => [field, existing?.[field] ?? ""])
  ) as Record<ProfileTextField, string>;
  const changed = planTranslationReset(previous, input, PROFILE_TEXT_FIELDS);
  const data = { ...input, ...clearedTranslations(changed) };

  const row = await prisma.aboutProfile.upsert({
    where: { id: PROFILE_ID },
    create: { id: PROFILE_ID, ...data },
    update: data,
  });

  void translateFields(PROFILE_ID, changed, input, (args) =>
    prisma.aboutProfile.updateMany(args)
  );
  return profileView(row);
}

export async function listProjects(opts: { includeHidden: boolean }): Promise<ProjectView[]> {
  const rows = await prisma.project.findMany({
    where: opts.includeHidden ? undefined : { isVisible: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  return rows.map(projectView);
}

export async function createProject(input: ProjectInput): Promise<ProjectView> {
  const last = await prisma.project.aggregate({ _max: { sortOrder: true } });
  const row = await prisma.project.create({
    data: { ...input, sortOrder: (last._max.sortOrder ?? 0) + 1 },
  });
  void translateFields(row.id, PROJECT_TEXT_FIELDS, input, (args) =>
    prisma.project.updateMany(args)
  );
  return projectView(row);
}

export async function updateProject(
  id: string,
  input: ProjectInput
): Promise<ProjectView | null> {
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return null;
  const changed = planTranslationReset(existing, input, PROJECT_TEXT_FIELDS);
  const row = await prisma.project.update({
    where: { id },
    data: { ...input, ...clearedTranslations(changed) },
  });
  void translateFields(id, changed, input, (args) => prisma.project.updateMany(args));
  return projectView(row);
}

export async function deleteProject(id: string): Promise<boolean> {
  const { count } = await prisma.project.deleteMany({ where: { id } });
  return count > 0;
}

export async function moveProject(id: string, direction: "up" | "down"): Promise<boolean> {
  const items = await prisma.project.findMany({ select: { id: true, sortOrder: true } });
  const current = items.find((item) => item.id === id);
  const neighbor = neighborToSwap(items, id, direction);
  if (!current || !neighbor) return false;
  await prisma.$transaction([
    prisma.project.update({ where: { id: current.id }, data: { sortOrder: neighbor.sortOrder } }),
    prisma.project.update({ where: { id: neighbor.id }, data: { sortOrder: current.sortOrder } }),
  ]);
  return true;
}
