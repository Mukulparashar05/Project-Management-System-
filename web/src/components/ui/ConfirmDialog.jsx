import { Button } from './Button.jsx';
import { Modal } from './Modal.jsx';

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onCancel}
      title={title}
      description={description}
      width="26rem"
      role="alertdialog"
    >
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
