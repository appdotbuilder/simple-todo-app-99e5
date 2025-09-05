import { db } from '../db';
import { todosTable } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { type UpdateTodoCompletionInput, type Todo } from '../schema';

export const updateTodoCompletion = async (input: UpdateTodoCompletionInput): Promise<Todo> => {
  try {
    // Update the todo with new completion status and updated timestamp
    const result = await db.update(todosTable)
      .set({ 
        completed: input.completed,
        updated_at: sql`NOW()` // Use SQL NOW() for accurate server timestamp
      })
      .where(eq(todosTable.id, input.id))
      .returning()
      .execute();

    // Check if todo was found and updated
    if (result.length === 0) {
      throw new Error(`Todo with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Todo completion update failed:', error);
    throw error;
  }
};