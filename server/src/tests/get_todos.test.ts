import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput } from '../schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all todos from database', async () => {
    // Create test todos directly in database
    await db.insert(todosTable)
      .values([
        {
          title: 'First Todo',
          description: 'First todo description',
          completed: false
        },
        {
          title: 'Second Todo', 
          description: null,
          completed: true
        },
        {
          title: 'Third Todo',
          description: 'Third todo description',
          completed: false
        }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    
    // Verify first todo
    expect(result[0].title).toEqual('First Todo');
    expect(result[0].description).toEqual('First todo description');
    expect(result[0].completed).toEqual(false);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Verify second todo (with null description)
    expect(result[1].title).toEqual('Second Todo');
    expect(result[1].description).toBeNull();
    expect(result[1].completed).toEqual(true);
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].updated_at).toBeInstanceOf(Date);

    // Verify third todo
    expect(result[2].title).toEqual('Third Todo');
    expect(result[2].description).toEqual('Third todo description');
    expect(result[2].completed).toEqual(false);
    expect(result[2].id).toBeDefined();
    expect(result[2].created_at).toBeInstanceOf(Date);
    expect(result[2].updated_at).toBeInstanceOf(Date);
  });

  it('should return todos with correct data types', async () => {
    // Create a test todo
    await db.insert(todosTable)
      .values({
        title: 'Type Test Todo',
        description: 'Testing data types',
        completed: true
      })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(1);
    
    const todo = result[0];
    
    // Verify all field types
    expect(typeof todo.id).toBe('number');
    expect(typeof todo.title).toBe('string');
    expect(typeof todo.description).toBe('string');
    expect(typeof todo.completed).toBe('boolean');
    expect(todo.created_at).toBeInstanceOf(Date);
    expect(todo.updated_at).toBeInstanceOf(Date);
  });

  it('should return todos in insertion order', async () => {
    // Create todos with distinct titles to verify order
    const todoTitles = ['Alpha Todo', 'Beta Todo', 'Gamma Todo'];
    
    for (const title of todoTitles) {
      await db.insert(todosTable)
        .values({
          title,
          description: `Description for ${title}`,
          completed: false
        })
        .execute();
    }

    const result = await getTodos();

    expect(result).toHaveLength(3);
    expect(result[0].title).toEqual('Alpha Todo');
    expect(result[1].title).toEqual('Beta Todo');
    expect(result[2].title).toEqual('Gamma Todo');
  });

  it('should handle mix of completed and incomplete todos', async () => {
    // Create todos with different completion states
    await db.insert(todosTable)
      .values([
        { title: 'Incomplete Todo 1', description: 'Not done', completed: false },
        { title: 'Complete Todo 1', description: 'Done', completed: true },
        { title: 'Incomplete Todo 2', description: null, completed: false },
        { title: 'Complete Todo 2', description: 'Also done', completed: true }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(4);
    
    const completed = result.filter(todo => todo.completed);
    const incomplete = result.filter(todo => !todo.completed);
    
    expect(completed).toHaveLength(2);
    expect(incomplete).toHaveLength(2);
    
    // Verify specific todos
    expect(completed.some(todo => todo.title === 'Complete Todo 1')).toBe(true);
    expect(completed.some(todo => todo.title === 'Complete Todo 2')).toBe(true);
    expect(incomplete.some(todo => todo.title === 'Incomplete Todo 1')).toBe(true);
    expect(incomplete.some(todo => todo.title === 'Incomplete Todo 2')).toBe(true);
  });
});