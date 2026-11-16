import { LanguageSwitch } from "@/components/layout/language-switch";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="fixed right-4 top-4 z-40">
        <LanguageSwitch className="bg-white shadow-2xs" />
      </div>
      {children}
    </>
  );
}
