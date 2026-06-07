import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface UserProfileData {
  login: string;
  phone_num: string;
  address: string;
  role: string;
  favorite_category: string;
}

const EyeOpenIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export function UserProfile() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialUsername = location.state?.username;

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [password, setPassword] = useState<string>(""); // Kept separate for security handling
  
  // Payment option tracking state variables
//   const [paymentAmount, setPaymentAmount] = useState<string>("");
//   const [paymentStatus, setPaymentStatus] = useState<string>("Pending");

  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const DARK_BLUE = "#0f2d5c";
  const ACCENT_BLUE = "#94a3b8";

  // Fetch true profile data directly from database on component initialization
  useEffect(() => {
    if (!initialUsername) {
      navigate("/");
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:5000/api/user/profile?username=${initialUsername}`);
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setPassword(data.password || ""); // Initialize password value safely
        } else {
          setMessage({ type: "error", text: "Failed to read profile details." });
        }
      } catch (error) {
        setMessage({ type: "error", text: "Database network fallback link error." });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [initialUsername, navigate]);

  const handleInputChange = (field: keyof UserProfileData) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: e.target.value });
  };

  // Submit profile record modifications to backend endpoint
  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setMessage(null);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/user/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_login: initialUsername, // Used to look up row index
          new_login: profile.login,
          password: password,
          phone_num: profile.phone_num,
          address: profile.address,
          favorite_category: profile.favorite_category
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: data.error || "Update operation rejected." });
        return;
      }

      setMessage({ type: "success", text: "Profile details updated successfully!" });
      
      // Update local storage session token pointer context if username changes
      setTimeout(() => {
        navigate("/profile", { state: { username: profile.login }, replace: true });
      }, 1000);

    } catch (error) {
      setMessage({ type: "error", text: "Internal network transport pipeline failure." });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-400">Loading user configuration profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-12" style={{ fontFamily: "'DM Sans', sans-serif", background: "#fafbff" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Sora:wght@600;700&display=swap" rel="stylesheet" />
      
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate("/Home", { state: { username: profile?.login } })} 
          className="text-xs text-slate-400 hover:text-slate-600 font-medium mb-6 flex items-center gap-1.5 transition-colors"
        >
          ← Return to Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left panel layout summary card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 h-fit text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-3 text-white" style={{ background: DARK_BLUE }}>
              {profile?.login.substring(0, 2).toUpperCase()}
            </div>
            <h2 className="font-bold text-lg" style={{ color: DARK_BLUE, fontFamily: "'Sora', sans-serif" }}>@{profile?.login}</h2>
            <p className="text-slate-400 text-xs mt-0.5 capitalize">Verified System Account • {profile?.role}</p>
          </div>

          {/* Right panel operational form cards layout stack */}
          <div className="lg:col-span-2 space-y-6">
            {message && (
              <div className={`p-4 rounded-xl text-xs font-medium border ${message.type === "success" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}>
                {message.text}
              </div>
            )}

            {/* Editable Profile Information Block */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8">
              <h3 className="text-base font-bold mb-4" style={{ color: DARK_BLUE, fontFamily: "'Sora', sans-serif" }}>Account Parameters</h3>
              
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Username</label>
                  <input type="text" value={profile?.login || ""} onChange={handleInputChange("login")} className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl outline-none" />
                </div>

                <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Password
                    </label>
                    <div className="relative">
                        <input 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className="w-full h-10 pl-3 pr-10 text-sm border border-slate-200 rounded-xl outline-none" 
                        placeholder="Enter clean unhashed password text..." 
                        />
                        <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 transition-colors hover:text-slate-600"
                        style={{ color: showPassword ? ACCENT_BLUE : "#94a3b8" }}
                        >
                        {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
                    <input type="text" value={profile?.phone_num || ""} onChange={handleInputChange("phone_num")} className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Favorite Category</label>
                    <select value={profile?.favorite_category || ""} onChange={handleInputChange("favorite_category")} className="w-full h-10 px-3 text-sm border border-slate-200 bg-white rounded-xl outline-none">
                      <option value="">None Specified</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Collectibles">Collectibles</option>
                      <option value="Fashion">Fashion</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Address</label>
                  <input type="text" value={profile?.address || ""} onChange={handleInputChange("address")} className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl outline-none" />
                </div>

                <button type="submit" className="px-5 h-10 font-semibold text-xs text-white rounded-xl shadow-xs transition-all" style={{ background: DARK_BLUE }}>
                  Update Profile
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}