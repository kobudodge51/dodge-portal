"use client";

export default function ConfirmButton({ label, message, className }: { label: string; message: string; className?: string }) {
  return (
    <button
      type="submit"
      className={className ?? "btn btn-danger btn-sm"}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {label}
    </button>
  );
}
