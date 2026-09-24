interface NameFieldProps {
  name: string;
  onNameChange: (value: string) => void;
}

export function NameField({ name, onNameChange }: NameFieldProps) {
  return (
    <label className="field" htmlFor="name-input">
      <span>Jméno</span>
      <input
        id="name-input"
        type="text"
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder="např. Tomáš"
        autoComplete="given-name"
        data-cy="name-input"
      />
    </label>
  );
}
