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
  auction_status: "Active" | "Closed";
  winner_login: string | null;
  tracking_number?: string | null;
  shipment_status?: string | null;
  shipping_address?: string | null;
}

interface NotificationItem {
  notification_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
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
const EditIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>;

export function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  const loggedInUser = location.state?.username || "Guest User";
  const userRole = location.state?.role || "Guest";
  const isBuyer = userRole === "Buyer";
  const isSeller = userRole === "Seller";
  const isAdmin = userRole === "Admin" || loggedInUser === "admin";

  const handleEndAuction = async (itemId: string) => {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/auction/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: itemId,
          seller_login: loggedInUser
        }),
      });

      if (response.ok) {
        const res = await fetch("http://127.0.0.1:5000/api/items");
        if (res.ok) setListings(await res.json());
      } else {
        alert("Failed to close auction.");
      }
    } catch (err) {
      console.error("Error closing auction:", err);
    }
  };

  const handleDeleteListing = async (itemId: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/items/${itemId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requester_login: loggedInUser })
      });

      if (response.ok) {
        const res = await fetch("http://127.0.0.1:5000/api/items");
        if (res.ok) setListings(await res.json());
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete listing.");
      }
    } catch (err) {
      console.error("Error deleting listing:", err);
    }
  };

  const handleMarkAsRead = async () => {
    if (loggedInUser === "Guest User" || notifications.length === 0) return;

    try {
      const response = await fetch("http://127.0.0.1:5000/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loggedInUser }),
      });

      if (response.ok) {
        console.log("Notifications marked as read in database.");
        // The database is updated. The next mount will fetch 0 items.
      }
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };
  
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Listing | null>(null);

  const handleEdit = (item: Listing) => {
    setForm({
      item_name: item.item_name,
      category: item.category,
      starting_price: item.current_bid.toString(),
      image_url: item.image_url,
      item_condition: item.item_condition,
      description: item.description
    });
    setEditingItem(item);
    setActiveTab("sell");
  };

  // Form Management states
  const [form, setForm] = useState<AuctionFormData>({
    item_name: "", category: "", starting_price: "", image_url: "", item_condition: "Excellent", description: ""
  });
  const [errors, setErrors] = useState<AuctionFormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [focused, setFocused] = useState<string | null>(null);

  const DARK_BLUE = "#0f2d5c";
  const ACCENT_BLUE = "#2563eb";

  // Fetch listings from database
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
  }, [activeTab]);

  useEffect(() => {
    if (loggedInUser === "Guest User") return;

    const fetchNotifs = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/notifications?username=${loggedInUser}`);
        if (res.ok) setNotifications(await res.json());
      } catch (err) {
        console.error("Failed to load notifications hook", err);
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000); // Poll database every 10 seconds
    return () => clearInterval(interval); // Clean up interval on component unmount
  }, [loggedInUser]);

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

  const handleAuctionSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);

    try {
      const url = editingItem 
        ? `http://127.0.0.1:5000/api/items/${editingItem.id}` 
        : "http://127.0.0.1:5000/auction";
      const method = editingItem ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          seller_login: editingItem ? editingItem.seller_login : loggedInUser,
          requester_login: loggedInUser
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ item_name: data.error || (editingItem ? "Failed to update listing." : "Failed to host item.") });
        setLoading(false);
        return;
      }

      setLoading(false);
      setForm({ item_name: "", category: "", starting_price: "", image_url: "", item_condition: "Excellent", description: "" });
      setEditingItem(null);
      setActiveTab("buy");
    } catch (error) {
      setErrors({ item_name: "Could not reach database server." });
      setLoading(false);
    }
  };

  const filteredListings = listings
    .filter(item => 
      item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aIsOwn = a.seller_login === loggedInUser;
      const bIsOwn = b.seller_login === loggedInUser;
      if (aIsOwn && !bIsOwn) return -1;
      if (!aIsOwn && bIsOwn) return 1;
      return 0;
    });

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif", background: "#fafbff" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Sora:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* NAVBAR CONTAINER */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 px-6 py-4 lg:px-16 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("buy")}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: DARK_BLUE, color: "white" }}>
            <StoreIcon />
          </div>
          <span className="text-xl font-bold" style={{ color: DARK_BLUE, fontFamily: "'Sora', sans-serif" }}>R'Market</span>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setActiveTab("buy")} className={`px-5 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "buy" ? "bg-white shadow-xs" : "text-slate-500"}`} style={{ color: activeTab === "buy" ? DARK_BLUE : undefined }}>
            {isSeller || isAdmin ? "Auction Listings" : "Discover & Buy"}
          </button>
          {(isSeller || isAdmin) && (
            <button onClick={() => { setActiveTab("sell"); setEditingItem(null); setForm({ item_name: "", category: "", starting_price: "", image_url: "", item_condition: "Excellent", description: "" }); }} className={`px-5 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "sell" ? "bg-white shadow-xs" : "text-slate-500"}`} style={{ color: activeTab === "sell" ? DARK_BLUE : undefined }}>List an Item</button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* NOTIFICATION BELL DROP-DOWN LAYOUT */}
          <div className="relative">
            <button 
              onClick={() => {
                const nextState = !showNotifDropdown;
                setShowNotifDropdown(nextState);
                
                if (nextState === true) {
                  // 1. Opening the tray: trigger backend database mark-as-read API
                  handleMarkAsRead();
                } else {
                  // 2. Closing the tray
                  setNotifications([]);
                }
              }}
              className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all relative cursor-pointer"
            >
              {/* BELL ICON */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              
              {/* UNREAD INDICATOR */}
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
            {/* DROPDOWN OVERLAY LIST */}
            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-100 shadow-xl rounded-2xl py-2 z-50 max-h-80 overflow-y-auto">
                <div className="px-4 py-2 border-b border-slate-50 font-bold text-xs uppercase tracking-wider text-slate-400">
                  Alerts Feed
                </div>
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 text-center">No new updates or alerts.</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.notification_id} className="p-3 text-xs border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors text-slate-600">
                      {n.message}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <button 
              onClick={() => navigate("/profile", { state: { username: loggedInUser } })}
              className="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              @{loggedInUser}
          </button>
          <button onClick={() => navigate("/login")} className="text-xs font-medium text-slate-400 hover:text-red-500 transition-colors">Logout</button>
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
                      <img 
                        src={item.image_url} 
                        alt={item.item_name} 
                        className="w-full h-full object-cover" 
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://coolbackgrounds.io/white-background/'; }} 
                      />
                      <span className="absolute top-3 left-3 bg-white/90 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md text-slate-700">
                        {item.category}
                      </span>
                      
                      <div 
                        className="absolute bottom-3 right-3 flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md text-white transition-colors"
                        style={{ background: item.auction_status === "Closed" ? "#ef4444" : "rgba(15,45,92,0.8)" }}
                      >
                         <ClockIcon /> {item.auction_status === "Closed" ? "Closed" : "Active"}
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(37,99,235,0.08)", color: ACCENT_BLUE }}>
                            Condition: {item.item_condition}
                          </span>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              {isAdmin && (
                                <button 
                                  onClick={() => handleEdit(item)}
                                  className="p-1.5 text-slate-400 hover:text-blue-500 bg-slate-50 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                                  title="Edit Listing"
                                >
                                  <EditIcon />
                                </button>
                              )}
                              {isAdmin && (
                                <button 
                                  onClick={() => handleDeleteListing(item.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                  title="Delete Listing"
                                >
                                  <TrashIcon />
                                </button>
                              )}
                            </div>
                            <span className="text-[11px] font-medium text-slate-500">
                              Seller: <span className="font-semibold text-slate-700">@{item.seller_login}</span>
                            </span>
                          </div>
                        </div>
                        
                        <h3 className="font-bold text-base mt-1 mb-1 line-clamp-1" style={{ color: DARK_BLUE }}>
                          {item.item_name}
                        </h3>
                        <p className="text-slate-400 text-xs line-clamp-2 mb-4">
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                        <div>
                          <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
                            {item.auction_status === "Closed" ? "Winning Bid" : "Current Bid"}
                          </p>
                          <p className="text-lg font-bold" style={{ color: DARK_BLUE }}>
                            ${Number(item.current_bid).toFixed(2)}
                          </p>
                        </div>

                        {/* ACTIONS CONDITIONAL MATRIX */}
                        {item.auction_status === "Closed" ? (
                          // Case 1: Auction is closed. 
                          item.tracking_number ? (
                            // Sub-Case: Order checked out. Visible to winning buyer and seller.
                            (item.winner_login === loggedInUser || item.seller_login === loggedInUser || isAdmin) ? (
                              <button 
                                onClick={() => navigate("/shipping", {
                                  state: {
                                    item_name: item.item_name,
                                    current_bid: item.current_bid,
                                    tracking_number: item.tracking_number,
                                    shipment_status: item.shipment_status,
                                    shipping_address: item.shipping_address,
                                    winner_login: item.winner_login,
                                    seller_login: item.seller_login,
                                    username: loggedInUser
                                  }
                                })}
                                className="px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                                style={{ background: ACCENT_BLUE }}
                              >
                                Track Order
                              </button>
                            ) : (
                              <button disabled className="px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-100 rounded-xl cursor-not-allowed">
                                Ended & Shipped
                              </button>
                            )
                          ) : item.winner_login === loggedInUser ? (
                            // Sub-Case: Order not placed yet. Winner sees checkout button.
                            <button 
                              onClick={() => navigate("/checkout", {
                                  state: {
                                    item_id: item.id,
                                    item_name: item.item_name,
                                    final_price: item.current_bid,
                                    username: loggedInUser
                                  }
                              })}
                              className="px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs bg-green-600 hover:bg-green-700 transition-colors cursor-pointer"
                            >
                              Checkout
                            </button>
                          ) : (
                            // Sub-Case: Order not placed yet. Others see winner tag.
                            <button 
                              disabled 
                              className="px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-100 rounded-xl cursor-not-allowed"
                            >
                              {item.winner_login ? `Won by @${item.winner_login}` : "No Bids"}
                            </button>
                          )
                        ) : (
                          // Case 2: Auction is active. 
                          (item.seller_login === loggedInUser || isAdmin) ? (
                            <button 
                              onClick={() => handleEndAuction(item.id)}
                              className="px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs bg-red-500 hover:bg-red-600 transition-colors cursor-pointer"
                            >
                              End Auction
                            </button>
                          ) : isBuyer ? (
                            <button 
                              onClick={() => navigate("/bid", {
                                state: {
                                  item_id: item.id,
                                  item_name: item.item_name,
                                  current_bid: item.current_bid,
                                  image_url: item.image_url,
                                  username: loggedInUser
                                }
                              })}
                              className="px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs cursor-pointer" 
                              style={{ background: DARK_BLUE }}
                            >
                              Place Bid
                            </button>
                          ) : (
                            // Seller's will not have a bid button
                            <h1></h1>
                          )
                        )}
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
            <h2 className="text-2xl font-bold mb-1" style={{ color: DARK_BLUE, fontFamily: "'Sora', sans-serif" }}>{editingItem ? "Edit Listing" : "Host a New Auction"}</h2>
            <p className="text-slate-400 text-sm mb-6">{editingItem ? `Modifying entry for ${editingItem.item_name}` : "List an item."}</p>

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
                {loading ? (editingItem ? "Updating Listing…" : "Publishing Listing…") : (editingItem ? "Save Modifications" : "Launch Marketplace Auction")}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}