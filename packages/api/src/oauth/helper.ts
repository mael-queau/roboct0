import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Creates a state and adds it to the database.
 * @description When using OAuth2 flows, it is strongly recommended to use unique strings (passed as 'state' query parameters) in order to verify that no cross-site request forgery was performed.
 * @returns A newly created state.
 */
export async function createState() {
  // Create a random string of characters to use as a state.
  const state = crypto.randomBytes(20).toString("hex");
  await prisma.state.create({
    data: { value: state },
    select: { value: true },
  });
  return state;
}

/**
 * Checks if a state is valid.
 * @param state The state to check.
 * @returns Whether the state is valid.
 */
export async function isValidState(state: string) {
  const result = await prisma.state.findUnique({
    where: { value: state },
  });

  return result && result.createdAt > new Date(Date.now() - 3600000);
}

/**
 * Deletes a state from the database
 * @description When using OAuth2 states, they need to be destroyed after having been used so as not to have collisions.
 * @param state The state string, to delete.
 */
export async function deleteState(state: string) {
  await prisma.state.delete({
    where: {
      value: state,
    },
  });
}
