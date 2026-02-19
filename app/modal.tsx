"use client"

import "./styles/modal.css"
import React, { useEffect, useRef } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function Modal({ open, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // Controls opening the modal
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Controls closing the modal
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault(); // prevent default close to control state
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("close", onClose);

    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("close", onClose);
    };
  }, [onClose]);

  // Controls closing the modal by clicking outside
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClick = (e: MouseEvent) => {
      const rect = dialog.getBoundingClientRect();
      const clickedInDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.bottom &&
        rect.left <= e.clientX &&
        e.clientX <= rect.right;

      if (!clickedInDialog) {
        onClose();
      }
    };

    dialog.addEventListener("click", handleClick);

    return () => dialog.removeEventListener("click", handleClick);
  }, [onClose]);

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modalContent">
        {children}
      </div>
      <div className="modalCloseButtonContainer">
        <button onClick={onClose} className="modalCloseButton">
          <svg
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <use href="/x.svg" />
          </svg>
        </button>
      </div>
    </dialog>
  );
}
