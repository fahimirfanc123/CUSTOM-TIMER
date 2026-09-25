import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WorkoutBuilder } from '../WorkoutBuilder';
import { CTRDatabase } from '../../../core/storage/db';
import { WorkoutRepository } from '../../../core/storage/workoutRepository';

describe('WorkoutBuilder Component', () => {
  let db: CTRDatabase;
  let repo: WorkoutRepository;

  beforeEach(async () => {
    db = new CTRDatabase(`test-builder-db-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    repo = new WorkoutRepository(db);
    await db.open();
  });

  it('renders initial create workout state with default exercise', () => {
    render(
      <WorkoutBuilder
        repository={repo}
        onBack={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: /create workout/i })).toBeDefined();
    expect(screen.getByLabelText(/workout title/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/exercise name/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /save workout/i })).toBeDefined();
  });

  it('allows typing a title and description', () => {
    render(
      <WorkoutBuilder
        repository={repo}
        onBack={vi.fn()}
      />
    );

    const titleInput = screen.getByLabelText(/workout title/i);
    fireEvent.change(titleInput, { target: { value: 'Full Body Burner' } });
    expect((titleInput as HTMLInputElement).value).toBe('Full Body Burner');

    const descInput = screen.getByLabelText(/description/i);
    fireEvent.change(descInput, { target: { value: 'High intensity conditioning' } });
    expect((descInput as HTMLTextAreaElement).value).toBe('High intensity conditioning');
  });

  it('allows adding a new exercise', () => {
    render(
      <WorkoutBuilder
        repository={repo}
        onBack={vi.fn()}
      />
    );

    expect(screen.getAllByPlaceholderText(/exercise name/i)).toHaveLength(1);

    const addBtn = screen.getByRole('button', { name: /add new exercise/i });
    fireEvent.click(addBtn);

    expect(screen.getAllByPlaceholderText(/exercise name/i)).toHaveLength(2);
  });

  it('allows duplicating an exercise', () => {
    render(
      <WorkoutBuilder
        repository={repo}
        onBack={vi.fn()}
      />
    );

    const nameInput = screen.getByPlaceholderText(/exercise name/i);
    fireEvent.change(nameInput, { target: { value: 'Push-ups' } });

    const duplicateBtn = screen.getByRole('button', { name: /duplicate exercise 1/i });
    fireEvent.click(duplicateBtn);

    const inputs = screen.getAllByPlaceholderText(/exercise name/i) as HTMLInputElement[];
    expect(inputs).toHaveLength(2);
    expect(inputs[0].value).toBe('Push-ups');
    expect(inputs[1].value).toBe('Push-ups Copy');
  });

  it('prompts confirmation when deleting an exercise and removes upon confirmation', async () => {
    render(
      <WorkoutBuilder
        repository={repo}
        onBack={vi.fn()}
      />
    );

    // Add second exercise first
    fireEvent.click(screen.getByRole('button', { name: /add new exercise/i }));
    expect(screen.getAllByPlaceholderText(/exercise name/i)).toHaveLength(2);

    const deleteBtn = screen.getByRole('button', { name: /delete exercise 1/i });
    fireEvent.click(deleteBtn);

    // Delete dialog appears
    expect(screen.getByRole('alertdialog')).toBeDefined();
    expect(screen.getByText(/delete workout\?/i)).toBeDefined();

    const confirmDeleteBtn = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).toBeNull();
      expect(screen.getAllByPlaceholderText(/exercise name/i)).toHaveLength(1);
    });
  });

  it('reorders exercises using Move Down and Move Up buttons', () => {
    render(
      <WorkoutBuilder
        repository={repo}
        onBack={vi.fn()}
      />
    );

    const input1 = screen.getByPlaceholderText(/exercise name/i);
    fireEvent.change(input1, { target: { value: 'Exercise A' } });

    fireEvent.click(screen.getByRole('button', { name: /add new exercise/i }));
    const inputs = screen.getAllByPlaceholderText(/exercise name/i);
    fireEvent.change(inputs[1], { target: { value: 'Exercise B' } });

    // Move Down first exercise
    const moveDownBtn = screen.getByRole('button', { name: /move exercise 1 down/i });
    fireEvent.click(moveDownBtn);

    const updatedInputs = screen.getAllByPlaceholderText(/exercise name/i) as HTMLInputElement[];
    expect(updatedInputs[0].value).toBe('Exercise B');
    expect(updatedInputs[1].value).toBe('Exercise A');
  });

  it('displays validation errors and prevents save if title is empty', async () => {
    const handleSaved = vi.fn();

    render(
      <WorkoutBuilder
        repository={repo}
        onBack={vi.fn()}
        onSaved={handleSaved}
      />
    );

    // Title is empty by default
    const saveBtn = screen.getByRole('button', { name: /save workout/i });
    fireEvent.click(saveBtn);

    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText(/workout title cannot be blank/i)).toBeDefined();
    expect(handleSaved).not.toHaveBeenCalled();
  });

  it('successfully saves valid workout to repository', async () => {
    const handleSaved = vi.fn();

    render(
      <WorkoutBuilder
        repository={repo}
        onBack={vi.fn()}
        onSaved={handleSaved}
      />
    );

    const titleInput = screen.getByLabelText(/workout title/i);
    fireEvent.change(titleInput, { target: { value: 'Chest & Triceps' } });

    const saveBtn = screen.getByRole('button', { name: /save workout/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleSaved).toHaveBeenCalled();
      expect(screen.getByRole('status')).toBeDefined();
      expect(screen.getByText(/workout saved successfully!/i)).toBeDefined();
    });

    const allInDb = await repo.getAll();
    expect(allInDb).toHaveLength(1);
    expect(allInDb[0].workout.title).toBe('Chest & Triceps');
  });

  it('opens workout preview modal and displays generated segments', () => {
    render(
      <WorkoutBuilder
        repository={repo}
        onBack={vi.fn()}
      />
    );

    const titleInput = screen.getByLabelText(/workout title/i);
    fireEvent.change(titleInput, { target: { value: 'Preview Test Workout' } });

    const previewBtn = screen.getByRole('button', { name: /preview workout/i });
    fireEvent.click(previewBtn);

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByRole('heading', { name: /workout preview/i })).toBeDefined();
    expect(screen.getByText(/preview test workout/i)).toBeDefined();
    expect(screen.getByText(/get ready/i)).toBeDefined();

    // Close preview
    const closeBtn = screen.getByRole('button', { name: /close preview/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('prompts unsaved changes dialog when navigating back with modified form', () => {
    const handleBack = vi.fn();

    render(
      <WorkoutBuilder
        repository={repo}
        onBack={handleBack}
      />
    );

    // Modify title to make form dirty
    const titleInput = screen.getByLabelText(/workout title/i);
    fireEvent.change(titleInput, { target: { value: 'Modified Title' } });

    // Click back button
    const backBtn = screen.getByRole('button', { name: /back to home/i });
    fireEvent.click(backBtn);

    // Unsaved dialog appears
    expect(screen.getByRole('alertdialog')).toBeDefined();
    expect(screen.getByText(/unsaved changes/i)).toBeDefined();
    expect(handleBack).not.toHaveBeenCalled();

    // Click Discard
    const discardBtn = screen.getByRole('button', { name: /discard/i });
    fireEvent.click(discardBtn);

    expect(handleBack).toHaveBeenCalled();
  });
});
