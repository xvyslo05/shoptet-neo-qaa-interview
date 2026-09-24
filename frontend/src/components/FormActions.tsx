interface FormActionsProps {
  onReset: () => void;
}

export function FormActions({ onReset }: FormActionsProps) {
  return (
    <div className="actions">
      <button
        className="button button--primary"
        type="submit"
        data-cy="confirm"
      >
        Potvrdit
      </button>
      <button
        className="button button--secondary"
        type="button"
        onClick={onReset}
        data-cy="reset"
      >
        Reset
      </button>
    </div>
  );
}
