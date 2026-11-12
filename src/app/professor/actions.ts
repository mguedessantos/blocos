"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { parseStudentList } from "@/lib/credentials";
import { requireUser } from "@/lib/dal/auth";
import {
  AccessError,
  addStudents,
  archiveClass,
  createClass,
  deleteStudent,
  renameClass,
  resetStudentPasswords,
  setStudentActive,
  type IssuedCredential,
} from "@/lib/dal/classes";
import { setCourseAssignment } from "@/lib/dal/lessons";

const STAFF = ["TEACHER", "ORG_ADMIN"] as const;
const className = z.string().trim().min(2, "Dê um nome para a turma.").max(60);

export type FormState = { error?: string } | undefined;
export type CredentialsState = { error?: string; warnings?: string[]; credentials?: IssuedCredential[] } | undefined;

function friendly(err: unknown): string {
  if (err instanceof AccessError) return err.message;
  console.error(err);
  return "Algo deu errado. Tente de novo.";
}

export async function createClassAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser([...STAFF]);
  const name = className.safeParse(formData.get("name"));
  if (!name.success) return { error: name.error.issues[0].message };
  const teacherId = (formData.get("teacherId") as string) || undefined;
  let classId: string;
  try {
    const result = await createClass(user, name.data, teacherId);
    if (!result.ok) return { error: result.reason };
    classId = result.classId;
  } catch (err) {
    return { error: friendly(err) };
  }
  redirect(`/professor/turmas/${classId}`);
}

export async function renameClassAction(classId: string, _: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser([...STAFF]);
  const name = className.safeParse(formData.get("name"));
  if (!name.success) return { error: name.error.issues[0].message };
  try {
    await renameClass(user, classId, name.data);
  } catch (err) {
    return { error: friendly(err) };
  }
  revalidatePath(`/professor/turmas/${classId}`);
  return undefined;
}

export async function archiveClassAction(classId: string) {
  const user = await requireUser([...STAFF]);
  await archiveClass(user, classId);
  redirect("/professor");
}

export async function addStudentsAction(classId: string, _: CredentialsState, formData: FormData): Promise<CredentialsState> {
  const user = await requireUser([...STAFF]);
  const { names, errors } = parseStudentList(String(formData.get("names") ?? ""));
  if (names.length === 0) return { error: errors[0] ?? "Informe pelo menos um nome." };
  try {
    const result = await addStudents(user, classId, names);
    if (!result.ok) return { error: result.reason };
    revalidatePath(`/professor/turmas/${classId}`);
    return { credentials: result.credentials, warnings: errors };
  } catch (err) {
    return { error: friendly(err) };
  }
}

export async function resetPasswordsAction(classId: string, _: CredentialsState, formData: FormData): Promise<CredentialsState> {
  const user = await requireUser([...STAFF]);
  const ids = formData.getAll("studentId").map(String).filter(Boolean);
  if (ids.length === 0) return { error: "Selecione pelo menos um aluno." };
  try {
    return { credentials: await resetStudentPasswords(user, classId, ids) };
  } catch (err) {
    return { error: friendly(err) };
  }
}

export async function setStudentActiveAction(classId: string, studentId: string, active: boolean) {
  const user = await requireUser([...STAFF]);
  await setStudentActive(user, studentId, active);
  revalidatePath(`/professor/turmas/${classId}`);
}

export async function deleteStudentAction(classId: string, studentId: string) {
  const user = await requireUser([...STAFF]);
  await deleteStudent(user, studentId);
  revalidatePath(`/professor/turmas/${classId}`);
}

export async function setCourseAssignmentAction(classId: string, courseId: string, assigned: boolean) {
  const user = await requireUser([...STAFF]);
  await setCourseAssignment(user, classId, courseId, assigned);
  revalidatePath(`/professor/turmas/${classId}`);
}
