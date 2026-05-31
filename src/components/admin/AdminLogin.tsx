"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "@/app/admin/actions";

export function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await adminLogin(formData);
      if (res.ok) router.refresh();
      else setError(res.error ?? "خطا");
    });
  }

  return (
    <form action={onSubmit} className="glass rounded-2xl p-5 space-y-3">
      <label className="block text-sm text-white/70">رمز عبور مدیریت</label>
      <input
        type="password"
        name="password"
        autoFocus
        className="w-full rounded-xl bg-white/5 px-3 py-2 outline-none focus:ring-2 ring-violet-400"
        placeholder="••••••••"
      />
      {error && (
        <div className="rounded-xl bg-rose-500/15 text-rose-200 px-3 py-2 text-sm">
          {error}
        </div>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "در حال ورود..." : "ورود"}
      </button>
      <p className="text-xs text-white/40">
        رمز پیش‌فرض در فایل <code>.env</code> با کلید <code>ADMIN_PASSWORD</code> قابل تغییر است.
      </p>
    </form>
  );
}
