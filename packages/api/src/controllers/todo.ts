import { asc, eq, not } from "drizzle-orm";
import db from "../db/drizzle";
import { todo } from "../db/schema";

export const createTodo = async (text: string) => {
  await db.insert(todo).values({
    text,
  });
};

export const getTodo = async (id: string) => {
  const data = await db.select().from(todo).where(eq(todo.id, id));

  return data[0];
};

export const listTodos = async () => {
  const data = await db.select().from(todo).orderBy(asc(todo.id));

  return data;
};

export const editTodo = async (id: string, text: string) => {
  await db.update(todo).set({ text }).where(eq(todo.id, id));
};

export const toggleTodo = async (id: string) => {
  await db
    .update(todo)
    .set({ done: not(todo.done) })
    .where(eq(todo.id, id));
};

export const deleteTodo = async (id: string) => {
  await db.delete(todo).where(eq(todo.id, id));
};

export default {
  addTodo: createTodo,
  listTodos,
  getTodo,
  editTodo,
  toggleTodo,
  deleteTodo,
};
