import { prisma } from "@/lib/db";
import { translateThoughtZhToEnFr } from "@/lib/translateThought";

/** 将中文标题/正文翻译为英、法并写回数据库；失败只打日志，不抛错 */
export async function translateAndSaveThought(
  id: string,
  title: string,
  content: string
): Promise<void> {
  try {
    const tr = await translateThoughtZhToEnFr(title, content);
    if (!tr) return;
    await prisma.thought.update({
      where: { id },
      data: {
        titleEn: tr.titleEn,
        contentEn: tr.contentEn,
        titleFr: tr.titleFr,
        contentFr: tr.contentFr,
      },
    });
  } catch (e) {
    console.error("[translateAndSaveThought]", id, e);
  }
}
