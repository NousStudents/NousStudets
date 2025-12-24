import { useState, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UseDeleteConfirmationOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}

export function useDeleteConfirmation(options: UseDeleteConfirmationOptions = {}) {
  const {
    title = "Confirm Delete",
    description = "Are you sure you want to delete this item? This action cannot be undone.",
    confirmText = "Delete",
    cancelText = "Cancel",
  } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [customDescription, setCustomDescription] = useState<string | null>(null);

  const confirmDelete = useCallback((onConfirm: () => void, itemDescription?: string) => {
    setPendingAction(() => onConfirm);
    setCustomDescription(itemDescription || null);
    setIsOpen(true);
  }, []);

  const handleConfirm = useCallback(() => {
    if (pendingAction) {
      pendingAction();
    }
    setIsOpen(false);
    setPendingAction(null);
    setCustomDescription(null);
  }, [pendingAction]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setPendingAction(null);
    setCustomDescription(null);
  }, []);

  const DeleteConfirmationDialog = useCallback(() => (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {customDescription || description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ), [isOpen, title, description, customDescription, confirmText, cancelText, handleConfirm, handleCancel]);

  return {
    confirmDelete,
    DeleteConfirmationDialog,
    isOpen,
  };
}
