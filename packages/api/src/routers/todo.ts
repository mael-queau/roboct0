import { z } from "zod";
import todoController from "../controllers/todo";
import { publicProcedure, router } from "../trpc";

export const todoRouter = router({
  listTodos: publicProcedure.query(async () => {
    return await todoController.listTodos();
  }),
  getTodo: publicProcedure.input(z.string()).query(async ({ input }) => {
    return await todoController.getTodo(input);
  }),
  createTodo: publicProcedure
    .input(z.object({ text: z.string() }))
    .mutation(async ({ input }) => {
      await todoController.addTodo(input.text);
    }),
  editTodo: publicProcedure
    .input(z.object({ id: z.string(), text: z.string() }))
    .mutation(async ({ input }) => {
      await todoController.editTodo(input.id, input.text);
    }),
  toggleTodo: publicProcedure.input(z.string()).mutation(async ({ input }) => {
    await todoController.toggleTodo(input);
  }),
  deleteTodo: publicProcedure.input(z.string()).mutation(async ({ input }) => {
    await todoController.deleteTodo(input);
  }),
});
