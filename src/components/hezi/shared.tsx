import React from "react";

export const C = "bg-white border border-[#EAEBEF] rounded-2xl shadow-sm";
export const OB = "bg-[#FF5400] text-white";
export const btBase =
  "flex items-center justify-center gap-2 w-full text-center rounded-xl py-3.5 px-4 font-extrabold text-sm transition active:scale-95 ";

export function Btn({
  href,
  onClick,
  c = "",
  dis = false,
  children,
}: {
  href?: string;
  onClick?: () => void;
  c?: string;
  dis?: boolean;
  children: React.ReactNode;
}) {
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={btBase + c}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      disabled={dis}
      onClick={onClick}
      className={btBase + c + (dis ? " opacity-60 cursor-not-allowed" : "")}
    >
      {children}
    </button>
  );
}

export function Chip({
  c = "",
  children,
}: {
  c?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 text-xs font-extrabold rounded-full px-3 py-1 " +
        c
      }
    >
      {children}
    </span>
  );
}

export function Hd({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-extrabold text-lg mb-3 text-[#111317] tracking-tight">
      {children}
    </h2>
  );
}
