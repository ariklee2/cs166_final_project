import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

interface FormData {
  username: string;
  password: string;
  phone: string;
  address: string;
}

interface FormErrors {
  username?: string;
  password?: string;
  phone?: string;
  address?: string;
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

const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const StoreIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

export function SignUp() {
  const [form, setForm] = useState<FormData>({ username: "", password: "", phone: "", address: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [focused, setFocused] = useState<string | null>(null);

  const navigate = useNavigate();

  const DARK_BLUE = "#0f2d5c";
  const MID_BLUE = "#1e4d8c";
  const ACCENT_BLUE = "#2563eb";

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.username.trim() || form.username.length < 3) e.username = "Username must be at least 3 characters";
    if (form.password.length < 8) e.password = "Password must be at least 8 characters";
    if (!/^\+?[\d\s\-()]{7,15}$/.test(form.phone)) e.phone = "Enter a valid phone number";
    if (!form.address.trim() || form.address.length < 10) e.address = "Please enter your full address";
    return e;
  };

  const handleChange = (field: keyof FormData) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate form layout rules (length, format)
    const errs = validate();
    if (Object.keys(errs).length) { 
      setErrors(errs); 
      return; 
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form), 
      });

      const data = await response.json();

      if (!response.ok) {
        // If the database returns a duplicate user error, apply it to the username input field
        setErrors({ username: data.error || "Registration failed." });
        setLoading(false);
        return;
      }

      setLoading(false);

      navigate("/Home", {
        state: {username: form.username}
      });

    } catch (error) {
      console.error("Network error:", error);
      setErrors({ username: "Could not reach server database." });
      setLoading(false);
    }
  };

  const fields: { key: keyof FormData; label: string; type: string; placeholder: string; Icon: () => JSX.Element; multiline?: boolean }[] = [
    { key: "username", label: "Username", type: "text", placeholder: "e.g. trader_joe99", Icon: UserIcon },
    { key: "password", label: "Password", type: "password", placeholder: "Min. 8 characters", Icon: LockIcon },
    { key: "phone", label: "Phone Number", type: "tel", placeholder: "+1 (555) 000-0000", Icon: PhoneIcon },
    { key: "address", label: "Shipping Address", type: "text", placeholder: "123 Main St, City, State, ZIP", Icon: MapPinIcon, multiline: true },
  ];

  return (
    <div className="min-h-screen bg-white flex" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Sora:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Left panel — dark blue branding */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-14 relative overflow-hidden" style={{ background: DARK_BLUE }}>
        {/* Subtle geometric decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-10" style={{ background: "white" }} />
          <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full opacity-5" style={{ background: "white", transform: "translate(-30%, 30%)" }} />
          <div className="absolute top-1/2 right-8 w-px h-48 opacity-10" style={{ background: "white" }} />
          <div className="absolute top-1/2 right-16 w-px h-32 opacity-5" style={{ background: "white" }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center" style={{ color: DARK_BLUE }}>
            <StoreIcon />
          </div>
          <span className="text-white text-xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>R'Market</span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10">
          <h1 className="text-white text-4xl font-bold leading-tight mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
            Buy. Sell.<br />
            <span style={{ color: "#93c5fd" }}>Connect.</span>
          </h1>
          <p className="text-blue-200 text-sm leading-relaxed mb-10 max-w-xs" style={{ opacity: 0.8 }}>
            R'Market is an open marketplace where anyone can list, discover, and purchase items from sellers around the world.
          </p>

          {/* Feature bullets */}
          <div className="space-y-4">
            {[
              { title: "Millions of listings", desc: "From electronics to collectibles" },
              { title: "Secure checkout", desc: "Buyer protection on every order" },
              { title: "Sell in minutes", desc: "List an item with just a few clicks" },
            ].map(({ title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center mt-0.5" style={{ background: "rgba(147,197,253,0.2)", border: "1px solid rgba(147,197,253,0.3)" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{title}</p>
                  <p className="text-blue-300 text-xs" style={{ opacity: 0.7 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10">
          <p className="text-blue-400 text-xs" style={{ opacity: 0.5 }}>Trusted by 2M+ buyers and sellers worldwide.</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16" style={{ background: "#fafbff" }}>
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: DARK_BLUE, color: "white" }}>
              <StoreIcon />
            </div>
            <span className="font-bold text-lg" style={{ color: DARK_BLUE, fontFamily: "'Sora', sans-serif" }}>R'Market</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1" style={{ color: DARK_BLUE, fontFamily: "'Sora', sans-serif" }}>Create your account</h2>
            <p className="text-slate-400 text-sm">Free to join. Start buying and selling instantly.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {fields.map(({ key, label, type, placeholder, Icon, multiline }) => {
              const isPassword = key === "password";
              const isFocused = focused === key;
              const hasError = !!errors[key];

              const borderColor = hasError
                ? "#f87171"
                : isFocused
                ? ACCENT_BLUE
                : "#dde3f0";

              const shadowStyle = isFocused
                ? `0 0 0 3px rgba(37,99,235,0.12)`
                : hasError
                ? `0 0 0 3px rgba(248,113,113,0.12)`
                : "none";

              const inputStyle: React.CSSProperties = {
                width: "100%",
                border: `1.5px solid ${borderColor}`,
                borderRadius: "10px",
                background: "white",
                color: "#0f172a",
                fontSize: "14px",
                fontFamily: "'DM Sans', sans-serif",
                outline: "none",
                boxShadow: shadowStyle,
                transition: "all 0.18s ease",
              };

              return (
                <div key={key}>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: DARK_BLUE, letterSpacing: "0.07em" }}>
                    {label}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 pointer-events-none" style={{ color: isFocused ? ACCENT_BLUE : "#94a3b8", transition: "color 0.18s" }}>
                      <Icon />
                    </span>
                    {multiline ? (
                      <textarea
                        value={form[key]}
                        onChange={handleChange(key)}
                        onFocus={() => setFocused(key)}
                        onBlur={() => setFocused(null)}
                        placeholder={placeholder}
                        rows={2}
                        style={{ ...inputStyle, paddingTop: "10px", paddingBottom: "10px", paddingLeft: "40px", paddingRight: "14px", resize: "none" }}
                      />
                    ) : (
                      <input
                        type={isPassword && showPassword ? "text" : type}
                        value={form[key]}
                        onChange={handleChange(key)}
                        onFocus={() => setFocused(key)}
                        onBlur={() => setFocused(null)}
                        placeholder={placeholder}
                        style={{ ...inputStyle, height: "46px", paddingLeft: "40px", paddingRight: isPassword ? "44px" : "14px" }}
                      />
                    )}
                    {isPassword && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 transition-colors"
                        style={{ color: showPassword ? ACCENT_BLUE : "#94a3b8" }}
                      >
                        {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                      </button>
                    )}
                  </div>
                  {errors[key] && (
                    <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: "#ef4444" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {errors[key]}
                    </p>
                  )}
                </div>
              );
            })}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 font-semibold text-sm rounded-xl transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                height: "48px",
                marginTop: "8px",
                background: loading ? MID_BLUE : DARK_BLUE,
                color: "white",
                fontFamily: "'Sora', sans-serif",
                letterSpacing: "0.02em",
                boxShadow: loading ? "none" : `0 4px 18px rgba(15,45,92,0.3)`,
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Creating account…
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="text-center text-xs mt-5" style={{ color: "#94a3b8" }}>
            Already have an account?{" "}
            <a onClick={() => navigate("/login")} className="font-semibold hover:underline underline-offset-2" style={{ color: ACCENT_BLUE }}>
              Login
            </a>
          </p>

          <p className="text-center text-xs mt-3" style={{ color: "#cbd5e1" }}>
            By signing up you agree to our{" "}
            <a href="#" className="hover:underline" style={{ color: "#94a3b8" }}>Terms</a>
            {" & "}
            <a href="#" className="hover:underline" style={{ color: "#94a3b8" }}>Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
