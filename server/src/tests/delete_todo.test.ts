import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a test todo first
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo to be deleted',
        completed: false
      })
      .returning()
      .execute();

    const createdTodo = insertResult[0];
    
    const deleteInput: DeleteTodoInput = {
      id: createdTodo.id
    };

    // Delete the todo
    const result = await deleteTodo(deleteInput);

    // Should indicate success
    expect(result.success).toBe(true);

    // Verify todo was actually deleted from database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, createdTodo.id))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should return false when todo does not exist', async () => {
    const deleteInput: DeleteTodoInput = {
      id: 99999 // Non-existent ID
    };

    const result = await deleteTodo(deleteInput);

    // Should indicate failure when todo doesn't exist
    expect(result.success).toBe(false);
  });

  it('should not affect other todos when deleting', async () => {
    // Create multiple test todos
    const insertResults = await db.insert(todosTable)
      .values([
        {
          title: 'Todo 1',
          description: 'First todo',
          completed: false
        },
        {
          title: 'Todo 2', 
          description: 'Second todo',
          completed: true
        },
        {
          title: 'Todo 3',
          description: 'Third todo',
          completed: false
        }
      ])
      .returning()
      .execute();

    const todoToDelete = insertResults[1]; // Delete the middle one

    const deleteInput: DeleteTodoInput = {
      id: todoToDelete.id
    };

    // Delete one specific todo
    const result = await deleteTodo(deleteInput);

    expect(result.success).toBe(true);

    // Verify only the targeted todo was deleted
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(2);
    
    // Verify the correct todos remain
    const remainingIds = remainingTodos.map(todo => todo.id);
    expect(remainingIds).toContain(insertResults[0].id);
    expect(remainingIds).toContain(insertResults[2].id);
    expect(remainingIds).not.toContain(todoToDelete.id);
  });

  it('should handle deletion of completed todos', async () => {
    // Create a completed todo
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Completed Todo',
        description: 'This todo is done',
        completed: true
      })
      .returning()
      .execute();

    const completedTodo = insertResult[0];
    
    const deleteInput: DeleteTodoInput = {
      id: completedTodo.id
    };

    // Delete the completed todo
    const result = await deleteTodo(deleteInput);

    expect(result.success).toBe(true);

    // Verify it was deleted
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, completedTodo.id))
      .execute();

    expect(todos).toHaveLength(0);
  });
});