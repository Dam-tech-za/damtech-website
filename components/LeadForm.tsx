import {
  LazyFormSection as FormSection,
} from "@/components/lazy";

type LeadFormProps = {
  sourcePage: string;
  submitLabel?: string;
  title?: string;
  subtitle?: string;
  id?: string;
};

/** @deprecated Prefer `FormSection` with explicit title and subtitle. */
export function LeadForm({
  sourcePage,
  submitLabel,
  title = "Project enquiry",
  subtitle = "Fields marked with * are required. We typically respond within one business day.",
  id,
}: LeadFormProps) {
  return (
    <FormSection
      id={id}
      title={title}
      subtitle={subtitle}
      sourcePage={sourcePage}
      submitLabel={submitLabel}
    />
  );
}
