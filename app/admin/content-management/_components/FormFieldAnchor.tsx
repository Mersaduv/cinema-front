"use client";

type FormFieldAnchorProps = {
  field: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
};

export default function FormFieldAnchor({
  field,
  error,
  children,
  className = "",
}: FormFieldAnchorProps) {
  return (
    <div
      data-form-field={field}
      className={`${className} ${error ? "rounded-[24px] ring-1 ring-red-400/45" : ""}`}
    >
      {children}
      {error ? (
        <p className="mt-2 text-xs font-medium text-red-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
