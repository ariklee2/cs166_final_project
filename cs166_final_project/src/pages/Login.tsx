import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

interface LoginFormData {
  username: string;
  password: string;
}

interface LoginFormErrors {
  username?: string;
  password?: string;
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

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const StoreIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

export function Login() {
  const [form, setForm] = useState<LoginFormData>({ username: "", password: "" });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [focused, setFocused] = useState<string | null>(null);

  const navigate = useNavigate();

  const DARK_BLUE = "#0f2d5c";
  const MID_BLUE = "#1e4d8c";
  const ACCENT_BLUE = "#2563eb";

  const validate = (): LoginFormErrors => {
    const e: LoginFormErrors = {};
    if (!form.username.trim()) e.username = "Username is required";
    if (!form.password) e.password = "Password is required";
    return e;
  };

  const handleChange = (field: keyof LoginFormData) => (e: ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const errs = validate();
    if (Object.keys(errs).length) { 
      setErrors(errs); 
      return; 
    }

    setLoading(true);

    // Admin Bypass
    if (form.username === "admin" && form.password === "admin") {
      setLoading(false);
      navigate("/Home", { state: { username: "admin", role: "Admin" } });
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form), 
      });

      const data = await response.json();

      if (!response.ok) {
        // Apply authentication errors directly onto fields
        setErrors({ username: data.error || "Login failed." });
        setLoading(false);
        return;
      }

      setLoading(false);
      
      // Navigate forward to homepage and attach the authentic user session state!
      navigate("/Home", { state: { username: data.login, role: data.role } });

    } catch (error) {
      console.error("Network error:", error);
      setErrors({ username: "Could not reach server database." });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Sora:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-14 relative overflow-hidden" style={{ background: DARK_BLUE }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-10" style={{ background: "white" }} />
          <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full opacity-5" style={{ background: "white", transform: "translate(-30%, 30%)" }} />
        </div>

        {/* BRAND LOGO */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center" style={{ color: DARK_BLUE }}>
            <StoreIcon />
          </div>
          <span className="text-white text-xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>R'Market</span>
        </div>

        {/* COPY TEXT BLOCK */}
        <div className="relative z-10">
          <h1 className="text-white text-4xl font-bold leading-tight mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
            Welcome back to the<br />
            <span style={{ color: "#93c5fd" }}>Marketplace.</span>
          </h1>
          <p className="text-blue-200 text-sm leading-relaxed max-w-xs" style={{ opacity: 0.8 }}>
            Log in to manage open active bids, check items track metrics, or spawn clean auctions tracking in seconds.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-blue-400 text-xs" style={{ opacity: 0.5 }}>Trusted by 2M+ buyers and sellers worldwide.</p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16" style={{ background: "#fafbff" }}>
        <div className="w-full max-w-md">

          {/* Mobile screen brand logo view toggle */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: DARK_BLUE, color: "white" }}>
              <StoreIcon />
            </div>
            <span className="font-bold text-lg" style={{ color: DARK_BLUE, fontFamily: "'Sora', sans-serif" }}>R'Market</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1" style={{ color: DARK_BLUE, fontFamily: "'Sora', sans-serif" }}>Sign in to account</h2>
            <p className="text-slate-400 text-sm">Welcome back! Please enter your credentials below.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* USERNAME INPUT */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: DARK_BLUE, letterSpacing: "0.07em" }}>
                Username / Login
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 pointer-events-none" style={{ color: focused === "username" ? ACCENT_BLUE : "#94a3b8", transition: "color 0.18s" }}>
                  <UserIcon />
                </span>
                <input
                  type="text"
                  value={form.username}
                  onChange={handleChange("username")}
                  onFocus={() => setFocused("username")}
                  onBlur={() => setFocused(null)}
                  placeholder="e.g. trader_joe99"
                  className="w-full h-11.5 pl-10 pr-4 text-sm rounded-xl outline-none transition-all"
                  style={{
                    border: `1.5px solid ${errors.username ? "#f87171" : focused === "username" ? ACCENT_BLUE : "#dde3f0"}`,
                    boxShadow: focused === "username" ? "0 0 0 3px rgba(37,99,235,0.12)" : errors.username ? "0 0 0 3px rgba(248,113,113,0.12)" : "none"
                  }}
                />
              </div>
            </div>

            {/* PASSWORD INPUT */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: DARK_BLUE, letterSpacing: "0.07em" }}>
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 pointer-events-none" style={{ color: focused === "password" ? ACCENT_BLUE : "#94a3b8", transition: "color 0.18s" }}>
                  <LockIcon />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange("password")}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  placeholder="••••••••"
                  className="w-full h-11.5 pl-10 pr-11 text-sm rounded-xl outline-none transition-all"
                  style={{
                    border: `1.5px solid ${errors.password ? "#f87171" : focused === "password" ? ACCENT_BLUE : "#dde3f0"}`,
                    boxShadow: focused === "password" ? "0 0 0 3px rgba(37,99,235,0.12)" : errors.password ? "0 0 0 3px rgba(248,113,113,0.12)" : "none"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 transition-colors"
                  style={{ color: showPassword ? ACCENT_BLUE : "#94a3b8" }}
                >
                  {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                </button>
              </div>
              
              {/* CENTRAL AUTH ERROR MESSAGES OUTPUT */}
              {(errors.username || errors.password) && (
                <p className="mt-2 text-xs flex items-center gap-1" style={{ color: "#ef4444" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {errors.username || errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 font-semibold text-sm rounded-xl transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white"
              style={{
                height: "48px",
                marginTop: "8px",
                background: loading ? MID_BLUE : DARK_BLUE,
                fontFamily: "'Sora', sans-serif",
                boxShadow: loading ? "none" : `0 4px 18px rgba(15,45,92,0.3)`,
              }}
            >
              {loading ? "Authenticating Verification..." : "Log In"}
            </button>
          </form>

          <p className="text-center text-xs mt-5" style={{ color: "#94a3b8" }}>
            Don't have an account yet?{" "}
            <a onClick={() => navigate("/signup")} className="font-semibold hover:underline cursor-pointer underline-offset-2" style={{ color: ACCENT_BLUE }}>
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}