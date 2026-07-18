'use client';

import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/EditOutlined';

import type { DocumentTemplate } from '../types';
import { useTranslation } from '@/lib/i18n';

// Sibling-group identity for drag-and-drop — dnd-kit's DndContext only gives
// onDragEnd the dragged/target ids, so each draggable node carries this via
// useSortable's `data` to let the page know which sibling list moved.
export interface DocumentDragData {
  milestoneId: string;
  parentId: string | null;
}

interface DocumentTemplateNodeProps {
  doc: DocumentTemplate;
  index: number;
  dragData: DocumentDragData;
  onAdd: (parentId: string) => void;
  onEdit: (doc: DocumentTemplate) => void;
  onDelete: (doc: DocumentTemplate) => void;
}

function DocumentTemplateNode({ doc, index, dragData, onAdd, onEdit, onDelete }: DocumentTemplateNodeProps) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: doc.id,
    data: dragData,
  });

  const children = [...(doc.children ?? [])].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <Box ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} sx={{ opacity: isDragging ? 0.5 : 1 }}>
      <Box
        className="flex items-center gap-2 py-0.5"
        sx={{
          mx: -1,
          px: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          transition: 'background-color 0.1s ease',
          bgcolor: index % 2 === 1 ? 'var(--2br-row-stripe)' : 'transparent',
          '&:hover': { bgcolor: 'var(--2br-overlay-row-hover)' },
        }}
      >
        <Box
          {...attributes}
          {...listeners}
          sx={{ display: 'flex', alignItems: 'center', cursor: 'grab', color: 'text.disabled', touchAction: 'none' }}
          aria-label={t('journey_template.drag_to_reorder')}
        >
          <DragIndicatorIcon fontSize="small" />
        </Box>
        <Typography variant="body2" sx={{ flexGrow: 1 }}>
          {doc.name}
        </Typography>
        {doc.company_id && <Chip label={t('journey_template.extra')} size="small" color="info" variant="outlined" />}
        {doc.is_required && <Chip label={t('journey_template.required')} size="small" variant="outlined" />}
        {doc.expiry_months != null && (
          <Chip label={t('journey_template.expires_in', { months: String(doc.expiry_months) })} size="small" variant="outlined" />
        )}
        <IconButton size="small" onClick={() => onAdd(doc.id)} aria-label={t('journey_template.add_sub_document')}>
          <AddIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => onEdit(doc)} aria-label={t('common.edit')}>
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => onDelete(doc)} aria-label={t('common.delete')}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>

      {children.length > 0 && (
        <Box sx={{ pl: 3.5, borderLeft: '2px solid', borderColor: 'divider', ml: 1.25 }}>
          <DocumentTemplateTree
            documents={children}
            milestoneId={dragData.milestoneId}
            parentId={doc.id}
            onAdd={onAdd}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </Box>
      )}
    </Box>
  );
}

interface DocumentTemplateTreeProps {
  documents: DocumentTemplate[];
  milestoneId: string;
  parentId: string | null;
  onAdd: (parentId: string) => void;
  onEdit: (doc: DocumentTemplate) => void;
  onDelete: (doc: DocumentTemplate) => void;
}

// One SortableContext per sibling group (this milestone's root list, or one
// document's own children) — drags stay within their own group, no
// cross-parent re-parenting via drag.
export default function DocumentTemplateTree({ documents, milestoneId, parentId, onAdd, onEdit, onDelete }: DocumentTemplateTreeProps) {
  const sorted = [...documents].sort((a, b) => a.sort_order - b.sort_order);
  const ids = sorted.map((d) => d.id);

  return (
    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
      {sorted.map((doc, index) => (
        <DocumentTemplateNode
          key={doc.id}
          doc={doc}
          index={index}
          dragData={{ milestoneId, parentId }}
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </SortableContext>
  );
}
