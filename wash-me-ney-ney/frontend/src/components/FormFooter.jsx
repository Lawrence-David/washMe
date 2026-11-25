export default function FormFooter({ onClose, saving, label, disabled = false }) {
  return (
    <div className="modalfooter">
      <button type="button" className="secondary" onClick={onClose}>Cancel</button>
      <button type="submit" className="primary" disabled={saving || disabled}>{saving ? 'Saving...' : label}</button>
    </div>
  );
}
