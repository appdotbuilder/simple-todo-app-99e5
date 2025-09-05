import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput } from '../schema';
import { createTodo } from '../handlers/create_todo';
import { eq } from 'drizzle-orm';

// Test inputs
const testInputWithDescription: CreateTodoInput = {
  title: 'Test Todo with Description',
  description: 'This is a test todo item with description'
};

const testInputWithoutDescription: CreateTodoInput = {
  title: 'Test Todo without Description'
  // description is optional and omitted
};

const testInputWithNullDescription: CreateTodoInput = {
  title: 'Test Todo with Null Description',
  description: null
};

describe('createTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a todo with description', async () => {
    const result = await createTodo(testInputWithDescription);

    // Basic field validation
    expect(result.title).toEqual('Test Todo with Description');
    expect(result.description).toEqual('This is a test todo item with description');
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a todo without description', async () => {
    const result = await createTodo(testInputWithoutDescription);

    // Basic field validation
    expect(result.title).toEqual('Test Todo without Description');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a todo with explicit null description', async () => {
    const result = await createTodo(testInputWithNullDescription);

    // Basic field validation
    expect(result.title).toEqual('Test Todo with Null Description');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save todo to database', async () => {
    const result = await createTodo(testInputWithDescription);

    // Query using proper drizzle syntax
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Test Todo with Description');
    expect(todos[0].description).toEqual('This is a test todo item with description');
    expect(todos[0].completed).toEqual(false);
    expect(todos[0].created_at).toBeInstanceOf(Date);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should set default values correctly', async () => {
    const result = await createTodo(testInputWithDescription);

    // Verify default values
    expect(result.completed).toEqual(false); // Default value from schema
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify timestamps are recent (within last 5 seconds)
    const now = new Date();
    const timeDiff = now.getTime() - result.created_at.getTime();
    expect(timeDiff).toBeLessThan(5000);
  });

  it('should create multiple todos with unique IDs', async () => {
    const result1 = await createTodo({ title: 'First Todo' });
    const result2 = await createTodo({ title: 'Second Todo' });

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.title).toEqual('First Todo');
    expect(result2.title).toEqual('Second Todo');
    
    // Both should exist in database
    const allTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(allTodos).toHaveLength(2);
    expect(allTodos.map(t => t.title)).toContain('First Todo');
    expect(allTodos.map(t => t.title)).toContain('Second Todo');
  });

  it('should handle long titles correctly', async () => {
    const longTitle = 'A'.repeat(100); // Create a long title
    const input: CreateTodoInput = {
      title: longTitle,
      description: 'Test with long title'
    };

    const result = await createTodo(input);

    expect(result.title).toEqual(longTitle);
    expect(result.description).toEqual('Test with long title');
  });
});