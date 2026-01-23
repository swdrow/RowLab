import { Shell } from '../../types/coach';
import { Pencil, Trash2 } from 'lucide-react';

interface ShellsTableProps {
  shells: Shell[];
  canEdit: boolean;
  onEdit: (shell: Shell) => void;
  onDelete: (id: string) => void;
}

export function ShellsTable({ shells, canEdit, onEdit, onDelete }: ShellsTableProps) {
  if (shells.length === 0) {
    return (
      <div className="text-center py-12 text-txt-secondary">
        No shells in fleet. {canEdit && 'Add your first shell to get started.'}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-bdr-primary">
            <th className="text-left py-3 px-4 text-sm font-medium text-txt-secondary">Name</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-txt-secondary">Class</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-txt-secondary">Type</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-txt-secondary">Status</th>
            {canEdit && <th className="text-right py-3 px-4 text-sm font-medium text-txt-secondary">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {shells.map((shell) => (
            <tr key={shell.id} className="border-b border-bdr-primary/50 hover:bg-surface-hover transition-colors">
              <td className="py-3 px-4 text-txt-primary font-medium">{shell.name}</td>
              <td className="py-3 px-4 text-txt-secondary">{shell.boatClass}</td>
              <td className="py-3 px-4 text-txt-secondary capitalize">{shell.type.toLowerCase()}</td>
              <td className="py-3 px-4">
                <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                  shell.status === 'AVAILABLE' ? 'bg-green-500/20 text-green-400' :
                  shell.status === 'IN_USE' ? 'bg-blue-500/20 text-blue-400' :
                  shell.status === 'MAINTENANCE' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {shell.status.replace('_', ' ')}
                </span>
              </td>
              {canEdit && (
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => onEdit(shell)}
                    className="p-1.5 hover:bg-surface-hover rounded-lg mr-1 transition-colors"
                    title="Edit shell"
                  >
                    <Pencil size={16} className="text-txt-secondary" />
                  </button>
                  <button
                    onClick={() => onDelete(shell.id)}
                    className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Delete shell"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
