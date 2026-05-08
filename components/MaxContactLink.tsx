import { ReactNode } from "react";

const MAX_URL = "https://web.max.ru/245465430";

interface MaxContactLinkProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function MaxContactLink({ children, className, title }: MaxContactLinkProps) {
  return (
    <a
      href={MAX_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      title={title}
    >
      {children}
    </a>
  );
}
