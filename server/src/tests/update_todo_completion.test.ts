import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoCompletionInput } from '../schema';
import { updateTodoCompletion } from '../handlers/update_todo_completion';
import { eq } from 'drizzle-orm';

describe('updateTodoCompletion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo completion status to true', async () => {
    // Create a test todo first
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing',
        completed: false
      })
      .returning()
      .execute();

    const todoId = createResult[0].id;

    const updateInput: UpdateTodoCompletionInput = {
      id: todoId,
      completed: true
    };

    const result = await updateTodoCompletion(updateInput);

    // Verify the returned result
    expect(result.id).toEqual(todoId);
    expect(result.title).toEqual('Test Todo');
    expect(result.description).toEqual('A todo for testing');
    expect(result.completed).toBe(true);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update todo completion status to false', async () => {
    // Create a completed todo first
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Completed Todo',
        description: null,
        completed: true
      })
      .returning()
      .execute();

    const todoId = createResult[0].id;

    const updateInput: UpdateTodoCompletionInput = {
      id: todoId,
      completed: false
    };

    const result = await updateTodoCompletion(updateInput);

    // Verify the completion status was updated
    expect(result.id).toEqual(todoId);
    expect(result.title).toEqual('Completed Todo');
    expect(result.description).toBeNull();
    expect(result.completed).toBe(false);
  });

  it('should update the updated_at timestamp', async () => {
    // Create a test todo
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Timestamp Test Todo',
        completed: false
      })
      .returning()
      .execute();

    const todoId = createResult[0].id;
    const originalUpdatedAt = createResult[0].updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateTodoCompletionInput = {
      id: todoId,
      completed: true
    };

    const result = await updateTodoCompletion(updateInput);

    // Verify updated_at timestamp was changed
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    
    // Verify created_at remains unchanged
    expect(result.created_at.getTime()).toEqual(createResult[0].created_at.getTime());
  });

  it('should persist changes in database', async () => {
    // Create a test todo
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Persistence Test Todo',
        completed: false
      })
      .returning()
      .execute();

    const todoId = createResult[0].id;

    const updateInput: UpdateTodoCompletionInput = {
      id: todoId,
      completed: true
    };

    await updateTodoCompletion(updateInput);

    // Query the database directly to verify persistence
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].completed).toBe(true);
    expect(todos[0].title).toEqual('Persistence Test Todo');
    expect(todos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when todo does not exist', async () => {
    const updateInput: UpdateTodoCompletionInput = {
      id: 999, // Non-existent ID
      completed: true
    };

    await expect(updateTodoCompletion(updateInput))
      .rejects.toThrow(/Todo with id 999 not found/i);
  });

  it('should handle todos with null descriptions', async () => {
    // Create todo with null description
    const createResult = await db.insert(todosTable)
      .values({
        title: 'No Description Todo',
        description: null,
        completed: false
      })
      .returning()
      .execute();

    const todoId = createResult[0].id;

    const updateInput: UpdateTodoCompletionInput = {
      id: todoId,
      completed: true
    };

    const result = await updateTodoCompletion(updateInput);

    expect(result.description).toBeNull();
    expect(result.completed).toBe(true);
    expect(result.title).toEqual('No Description Todo');
  });

  it('should handle multiple completion status toggles', async () => {
    // Create a test todo
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Toggle Test Todo',
        completed: false
      })
      .returning()
      .execute();

    const todoId = createResult[0].id;

    // Toggle to completed
    const firstUpdate = await updateTodoCompletion({
      id: todoId,
      completed: true
    });

    expect(firstUpdate.completed).toBe(true);

    // Toggle back to incomplete
    const secondUpdate = await updateTodoCompletion({
      id: todoId,
      completed: false
    });

    expect(secondUpdate.completed).toBe(false);
    expect(secondUpdate.updated_at.getTime()).toBeGreaterThan(firstUpdate.updated_at.getTime());

    // Toggle back to completed again
    const thirdUpdate = await updateTodoCompletion({
      id: todoId,
      completed: true
    });

    expect(thirdUpdate.completed).toBe(true);
    expect(thirdUpdate.updated_at.getTime()).toBeGreaterThan(secondUpdate.updated_at.getTime());
  });
});