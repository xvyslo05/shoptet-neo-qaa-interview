interface DateFieldsProps {
  date: string;
  pickerDate: string;
  onDateChange: (value: string) => void;
  onPickerChange: (value: string) => void;
}

export function DateFields({
  date,
  pickerDate,
  onDateChange,
  onPickerChange,
}: DateFieldsProps) {
  return (
    <div className="date-fields">
      <label className="field" htmlFor="date-input">
        <span>Datum</span>
        <input
          id="date-input"
          type="text"
          value={date}
          onChange={(event) => onDateChange(event.target.value)}
          placeholder="např. 7.3."
          data-cy="date-input"
        />
      </label>

      <label className="field field--picker" htmlFor="date-picker">
        <span>Vybrat datum</span>
        <input
          id="date-picker"
          type="date"
          value={pickerDate}
          onChange={(event) => onPickerChange(event.target.value)}
          data-cy="date-picker"
        />
      </label>
    </div>
  );
}
