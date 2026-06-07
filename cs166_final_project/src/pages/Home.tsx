import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface AuctionFormData {
  item_name: string;
  category: string;
  starting_price: string;
  image_url: string;
  item_condition: string;
  description: string;
}

interface AuctionFormErrors {
  item_name?: string;
  category?: string;
  starting_price?: string;
  image_url?: string;
  item_condition?: string;
  description?: string;
}

interface Listing {
  id: string;
  item_name: string;
  category: string;
  current_bid: number;
  image_url: string;
  item_condition: string;
  description: string;
  seller_login: string; 
  ends_in?: string; // Optional 
}

// Icons
const StoreIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const SearchIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const TagIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>;
const DollarIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
const ImageIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;
const InfoIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>;
const StarIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
const ClockIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;

export function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  const loggedInUser = location.state?.username || "Guest User";
  
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [listings, setListings] = useState<Listing[]>([]);

  // Form Management states
  const [form, setForm] = useState<AuctionFormData>({
    item_name: "", category: "", starting_price: "", image_url: "", item_condition: "Excellent", description: ""
  });
  const [errors, setErrors] = useState<AuctionFormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [focused, setFocused] = useState<string | null>(null);

  const DARK_BLUE = "#0f2d5c";
  const ACCENT_BLUE = "#2563eb";

// --- EFFECT HOOK: FETCH LISTINGS FROM POSTGRESQL ---
useEffect(() => {
  const loadMarketplaceData = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/items");
      if (response.ok) {
        const data = await response.json();
        setListings(data);
      }
    } catch (err) {
      console.error("Error reading database listings:", err);
    }
  };

  loadMarketplaceData();
}, [activeTab]); // Triggers reload when alternating between tabs

  const handleFormChange = (field: keyof AuctionFormData) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const validateForm = (): AuctionFormErrors => {
    const e: AuctionFormErrors = {};
    if (!form.item_name.trim()) e.item_name = "Item name is required";
    if (!form.category) e.category = "Please select a category";
    if (!form.starting_price || parseFloat(form.starting_price) <= 0) e.starting_price = "Enter a price greater than 0";
    if (!form.image_url.trim()) e.image_url = "Enter a valid image URL link";
    if (!form.description.trim() || form.description.length < 10) e.description = "Provide a slightly longer description detail";
    return e;
  };

  // --- SUBMIT COMPONENT: LOG AUCTION OBJECT ---
  const handleAuctionSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/auction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          seller_login: loggedInUser
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ item_name: data.error || "Failed to host item." });
        setLoading(false);
        return;
      }

      setLoading(false);
      setForm({ item_name: "", category: "", starting_price: "", image_url: "", item_condition: "Excellent", description: "" });
      setActiveTab("buy"); // Switch to discover tab to see live update
    } catch (error) {
      setErrors({ item_name: "Could not reach database server." });
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(item => 
    item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif", background: "#fafbff" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Sora:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Navbar Container */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 px-6 py-4 lg:px-16 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("buy")}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: DARK_BLUE, color: "white" }}>
            <StoreIcon />
          </div>
          <span className="text-xl font-bold" style={{ color: DARK_BLUE, fontFamily: "'Sora', sans-serif" }}>R'Market</span>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setActiveTab("buy")} className={`px-5 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "buy" ? "bg-white shadow-xs" : "text-slate-500"}`} style={{ color: activeTab === "buy" ? DARK_BLUE : undefined }}>Discover & Buy</button>
          <button onClick={() => setActiveTab("sell")} className={`px-5 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "sell" ? "bg-white shadow-xs" : "text-slate-500"}`} style={{ color: activeTab === "sell" ? DARK_BLUE : undefined }}>List an Item</button>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
            @{loggedInUser}
          </span>
          <button onClick={() => navigate("/")} className="text-xs font-medium text-slate-400 hover:text-red-500 transition-colors">Logout</button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 lg:px-16">
        {/* BUY VIEW */}
        {activeTab === "buy" && (
          <div>
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight" style={{ color: DARK_BLUE, fontFamily: "'Sora', sans-serif" }}>Live Open Auctions</h2>
              </div>

              <div className="relative w-full md:w-80">
                <span className="absolute left-3.5 top-3.5 text-slate-400"><SearchIcon /></span>
                <input type="text" placeholder="Search listings..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none bg-white"/>
              </div>
            </div>

            {filteredListings.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl">
                <p className="text-slate-400 text-sm">No items found in the marketplace database.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((item) => (
                  <div key={item.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs flex flex-col">
                    <div className="relative h-48 bg-slate-100">
                      <img src={item.image_url} alt={item.item_name} className="w-full h-full object-cover" onError={(e)=>{(e.target as HTMLImageElement).src='https://commons.wikimedia.org/wiki/File:Image_not_available.png';}} />
                      <span className="absolute top-3 left-3 bg-white/90 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md text-slate-700">{item.category}</span>
                      <div className="absolute bottom-3 right-3 bg-slate-900/80 text-white flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md"><ClockIcon/> Active</div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(37,99,235,0.08)", color: ACCENT_BLUE }}>
                              Condition: {item.item_condition}
                            </span>
                            
                            {/* Displaying the seller username tag */}
                            <span className="text-[11px] font-medium text-slate-500">
                              Seller: <span className="font-semibold text-slate-700">@{item.seller_login}</span>
                            </span>
                          </div>
                          
                          <h3 className="font-bold text-base mt-1 mb-1 line-clamp-1" style={{ color: DARK_BLUE }}>{item.item_name}</h3>
                          <p className="text-slate-400 text-xs line-clamp-2 mb-4">{item.description}</p>
                        </div>

                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                          <div>
                            <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Current Bid</p>
                            <p className="text-lg font-bold" style={{ color: DARK_BLUE }}>${Number(item.current_bid).toFixed(2)}</p>
                          </div>
                          <button className="px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs" style={{ background: DARK_BLUE }}>Place Bid</button>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SELL VIEW */}
        {activeTab === "sell" && (
          <div className="max-w-2xl mx-auto bg-white border border-slate-100 p-8 rounded-2xl shadow-xs">
            <h2 className="text-2xl font-bold mb-1" style={{ color: DARK_BLUE, fontFamily: "'Sora', sans-serif" }}>Host a New Auction</h2>
            <p className="text-slate-400 text-sm mb-6">List an item to store it securely in the relational tables.</p>

            <form onSubmit={handleAuctionSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: DARK_BLUE }}>Item Name</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5" style={{ color: focused === "item_name" ? ACCENT_BLUE : "#94a3b8" }}><TagIcon /></span>
                  <input type="text" value={form.item_name} onChange={handleFormChange("item_name")} onFocus={() => setFocused("item_name")} onBlur={() => setFocused(null)} placeholder="e.g. Classic Watch" className="w-full h-11.5 pl-10 pr-4 text-sm rounded-xl outline-none" style={{ border: `1.5px solid ${errors.item_name ? "#f87171" : focused === "item_name" ? ACCENT_BLUE : "#dde3f0"}` }}/>
                </div>
                {errors.item_name && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><InfoIcon /> {errors.item_name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: DARK_BLUE }}>Category</label>
                  <select value={form.category} onChange={handleFormChange("category")} className="w-full h-11.5 px-4 text-sm rounded-xl border bg-white" style={{ border: `1.5px solid ${errors.category ? "#f87171" : "#dde3f0"}` }}>
                    <option value="">Select Category</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Collectibles">Collectibles</option>
                    <option value="Fashion">Fashion</option>
                  </select>
                  {errors.category && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><InfoIcon /> {errors.category}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: DARK_BLUE }}>Condition</label>
                  <select value={form.item_condition} onChange={handleFormChange("item_condition")} className="w-full h-11.5 px-4 text-sm rounded-xl border bg-white border-slate-200">
                    <option value="New">Brand New</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: DARK_BLUE }}>Starting Price ($)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5" style={{ color: focused === "starting_price" ? ACCENT_BLUE : "#94a3b8" }}><DollarIcon /></span>
                  <input type="number" step="0.01" value={form.starting_price} onChange={handleFormChange("starting_price")} onFocus={() => setFocused("starting_price")} onBlur={() => setFocused(null)} placeholder="0.00" className="w-full h-11.5 pl-10 pr-4 text-sm rounded-xl outline-none" style={{ border: `1.5px solid ${errors.starting_price ? "#f87171" : focused === "starting_price" ? ACCENT_BLUE : "#dde3f0"}` }}/>
                </div>
                {errors.starting_price && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><InfoIcon /> {errors.starting_price}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: DARK_BLUE }}>Image URL</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5" style={{ color: focused === "image_url" ? ACCENT_BLUE : "#94a3b8" }}><ImageIcon /></span>
                  <input type="text" value={form.image_url} onChange={handleFormChange("image_url")} onFocus={() => setFocused("image_url")} onBlur={() => setFocused(null)} placeholder="https://..." className="w-full h-11.5 pl-10 pr-4 text-sm rounded-xl outline-none" style={{ border: `1.5px solid ${errors.image_url ? "#f87171" : focused === "image_url" ? ACCENT_BLUE : "#dde3f0"}` }}/>
                </div>
                {errors.image_url && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><InfoIcon /> {errors.image_url}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: DARK_BLUE }}>Description</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5" style={{ color: focused === "description" ? ACCENT_BLUE : "#94a3b8" }}><StarIcon /></span>
                  <textarea value={form.description} onChange={handleFormChange("description")} onFocus={() => setFocused("description")} onBlur={() => setFocused(null)} placeholder="Describe your item details..." rows={3} className="w-full pl-10 pr-4 py-3 text-sm rounded-xl outline-none resize-none" style={{ border: `1.5px solid ${errors.description ? "#f87171" : focused === "description" ? ACCENT_BLUE : "#dde3f0"}` }}/>
                </div>
                {errors.description && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><InfoIcon /> {errors.description}</p>}
              </div>

              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 font-semibold text-sm rounded-xl text-white transition-all disabled:opacity-60" style={{ height: "48px", background: DARK_BLUE }}>
                {loading ? "Publishing Listing…" : "Launch Marketplace Auction"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}