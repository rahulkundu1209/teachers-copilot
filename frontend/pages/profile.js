import Layout from "../components/Layout";
import profileImage from "../assets/profile.png"; 
export default function ProfilePage() {
  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Profile</h2>
        <p className="text-sm text-slate-500">User details</p>
      </div>

      <div className="bg-white p-6 rounded shadow flex items-center gap-6">
        <img src={profileImage.src} alt="profile" className="w-24 h-24 rounded-md object-cover"/>
        <div>
          <div className="font-semibold">Raj (Snehaswis Malik)</div>
          <div className="text-sm text-slate-500">Email: raj@example.com</div>
          <div className="text-sm text-slate-500">Role: Teacher</div>
        </div>
      </div>
    </Layout>
  );
}
