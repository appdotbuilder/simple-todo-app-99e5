import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Trash2, Plus, CheckCircle, Circle } from 'lucide-react';
// Using type-only import for better TypeScript compliance
import type { Todo, CreateTodoInput } from '../../server/src/schema';

function App() {
  // Explicit typing with Todo interface
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state with proper typing for nullable fields
  const [formData, setFormData] = useState<CreateTodoInput>({
    title: '',
    description: null // Explicitly null, not undefined
  });

  // useCallback to memoize function used in useEffect
  const loadTodos = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty deps since trpc is stable

  // useEffect with proper dependencies
  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    setIsCreating(true);
    try {
      const response = await trpc.createTodo.mutate(formData);
      // Update todos list with explicit typing in setState callback
      setTodos((prev: Todo[]) => [...prev, response]);
      // Reset form
      setFormData({
        title: '',
        description: null
      });
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleComplete = async (id: number, completed: boolean) => {
    try {
      const updatedTodo = await trpc.updateTodoCompletion.mutate({ id, completed });
      // Update the specific todo in the list
      setTodos((prev: Todo[]) => 
        prev.map((todo: Todo) => 
          todo.id === id ? { ...todo, completed: updatedTodo.completed } : todo
        )
      );
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteTodo.mutate({ id });
      // Remove todo from the list
      setTodos((prev: Todo[]) => prev.filter((todo: Todo) => todo.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📝 Todo App</h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
          {totalCount > 0 && (
            <div className="mt-4 flex justify-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {completedCount} completed
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {totalCount - completedCount} remaining
              </Badge>
            </div>
          )}
        </div>

        {/* Add Todo Form */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Todo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="What needs to be done? 🎯"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateTodoInput) => ({ ...prev, title: e.target.value }))
                }
                required
                className="text-lg"
              />
              <Textarea
                placeholder="Add a description (optional) 📝"
                // Handle nullable field with fallback to empty string
                value={formData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateTodoInput) => ({
                    ...prev,
                    description: e.target.value || null // Convert empty string back to null
                  }))
                }
                className="resize-none"
                rows={3}
              />
              <Button type="submit" disabled={isCreating || !formData.title.trim()} className="w-full">
                {isCreating ? 'Creating...' : '✨ Add Todo'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading todos... ⏳</div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && todos.length === 0 && (
          <Card className="shadow-lg">
            <CardContent className="py-12 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No todos yet!</h3>
              <p className="text-gray-500">Create your first todo above to get started.</p>
            </CardContent>
          </Card>
        )}

        {/* Todo List */}
        {!isLoading && todos.length > 0 && (
          <div className="space-y-4">
            {todos.map((todo: Todo) => (
              <Card key={todo.id} className={`shadow-lg transition-all duration-200 hover:shadow-xl ${
                todo.completed ? 'bg-green-50 border-green-200' : 'bg-white'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => handleToggleComplete(todo.id, !todo.completed)}
                      className="mt-1 transition-colors duration-200"
                    >
                      {todo.completed ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg font-semibold ${
                        todo.completed 
                          ? 'text-green-800 line-through' 
                          : 'text-gray-800'
                      }`}>
                        {todo.title}
                      </h3>
                      
                      {/* Handle nullable description */}
                      {todo.description && (
                        <p className={`mt-2 ${
                          todo.completed 
                            ? 'text-green-600 line-through' 
                            : 'text-gray-600'
                        }`}>
                          {todo.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span>Created: {todo.created_at.toLocaleDateString()}</span>
                        {todo.completed && (
                          <>
                            <Separator orientation="vertical" className="h-4" />
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              ✅ Completed
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Todo</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{todo.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(todo.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Built with React, tRPC, and Radix UI ✨</p>
        </div>
      </div>
    </div>
  );
}

export default App;