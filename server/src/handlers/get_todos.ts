import { db } from '../db';
import { todosTable } from '../db/schema';
import { type Todo } from '../schema';

export const getTodos = async (): Promise<Todo[]> => {
  try {
    // Fetch all todos from database
    const results = await db.select()
      .from(todosTable)
      .execute();

    // Return results (no numeric conversions needed for this table)
    return results;
  } catch (error) {
    console.error('Failed to fetch todos:', error);
    throw error;
  }
};