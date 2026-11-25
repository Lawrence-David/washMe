import { Pencil, Trash2 } from 'lucide-react';

// Edit / Delete icon buttons. Leave out onDelete to hide the delete button.
export default function RowActions({ onEdit, onDelete, editLabel = 'Edit' }) {
  return (
    <div className="actions">
      <button className="iconbtn" aria-label={editLabel} title={editLabel} onClick={onEdit}><Pencil size={16} /></button>
      {onDelete && (
        <button className="iconbtn delete" aria-label="Delete" title="Delete" onClick={onDelete}><Trash2 size={16} /></button>
      )}
    </div>
  );
}
