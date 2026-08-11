"use server";

import { insertMatchResult, type NewMatchRecord } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function saveMatchResult(record: NewMatchRecord): Promise<void> {
  await insertMatchResult(record);
  revalidatePath("/");
}
