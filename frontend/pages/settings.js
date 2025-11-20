import Layout from "../components/Layout";

export default function Settings() {
  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Settings</h2>
        <p className="text-sm text-slate-500">Basic placeholders — add real settings later</p>
      </div>

      <div className="bg-white p-6 rounded shadow space-y-4">
        <div>
          <div className="text-sm font-medium">Theme</div>
          <div className="mt-2 flex gap-2">
            <button className="px-3 py-1 bg-slate-100 rounded">Light (default)</button>
            <button className="px-3 py-1 bg-slate-200 rounded">Dark</button>
          </div>
        </div>

        <div>
          <h3 className="font-semibold">Account</h3>
          <p className="text-sm text-slate-500">Profile options will be added here.</p>
        </div>
      </div>
    </Layout>
  );
}
