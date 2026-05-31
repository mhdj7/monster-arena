export const dynamic = "force-dynamic";

import { isAdmin } from "@/lib/admin";
import { getAdminSpecies, getResourceTypesList } from "@/lib/game/queries";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default async function AdminPage() {
  const admin = await isAdmin();

  if (!admin) {
    return (
      <div className="max-w-md mx-auto space-y-5">
        <h1 className="text-2xl font-extrabold">🛠️ پنل مدیریت</h1>
        <p className="text-white/60 text-sm">
          این بخش فقط برای سازنده‌ی بازی است. برای ورود رمز عبور را وارد کن.
        </p>
        <AdminLogin />
      </div>
    );
  }

  const [species, resources] = await Promise.all([
    getAdminSpecies(),
    getResourceTypesList(),
  ]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">🛠️ پنل مدیریت</h1>
      <p className="text-white/60 text-sm">
        کارت‌های هیولا را بساز، ویرایش کن و بالانس کن. تغییرات بلافاصله در بازی اعمال
        و در دیتابیس ذخیره می‌شوند.
      </p>
      <AdminDashboard species={species} resources={resources} />
    </div>
  );
}
