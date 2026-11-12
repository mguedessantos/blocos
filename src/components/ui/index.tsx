import { CircleAlert } from "lucide-react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "success" | "danger";
const VARIANT: Record<Variant, string> = { primary: "", secondary: "btn-secondary", success: "btn-success", danger: "btn-danger" };

/** Classes de botão para usar também em <Link>. */
export function buttonClass(variant: Variant = "primary", size: "md" | "sm" = "md", extra = "") {
  return `btn ${VARIANT[variant]} ${size === "sm" ? "btn-sm" : ""} ${extra}`.trim();
}

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "md" | "sm" }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function Input({ label, hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-bold">
      {label}
      <input
        className="min-h-12 rounded-2xl border-2 border-line bg-white px-4 py-3 text-base font-semibold shadow-[inset_0_2px_0_rgb(15_23_42/0.04)] outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15"
        {...props}
      />
      {hint && <span className="text-xs font-semibold text-muted">{hint}</span>}
    </label>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`clay p-6 ${className}`}>{children}</div>;
}

export function Alert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
      <CircleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1 text-sm font-extrabold text-brand-shadow ${className}`}>{children}</span>;
}

/** Título de página com ícone em “pastilha”. */
export function PageHeader({ icon, title, subtitle, children }: { icon?: ReactNode; title: ReactNode; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        {icon && <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand text-brand-text shadow-[0_4px_0_var(--brand-shadow)]" aria-hidden>{icon}</span>}
        <div>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-0.5 font-semibold text-muted">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}
