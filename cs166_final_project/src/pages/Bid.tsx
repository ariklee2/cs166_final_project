import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function Bid() {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve states passed forward from the Home selection click
  const { item_id, item_name, current_bid, image_url, username } = location.state || {};

  const [bidAmount, setBidAmount] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const DARK_BLUE = "#0f2d5c";
  const ACCENT_BLUE = "#2563eb";

  // Safeguard: Redirect users back to Home if they try navigating straight to /bid without an item context
  if (!item_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-sm text-slate-500 mb-4">No active auction selected.</p>
          <button onClick={() => navigate("/Home")} className="px-4 py-2 text-xs text-white rounded-xl" style={{ background: DARK_BLUE }}>Back Home</button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const parsedBid = parseFloat(bidAmount);
    if (isNaN(parsedBid) || parsedBid <= parseFloat(current_bid)) {
      setError(`Your bid amount must be strictly greater than the current bid of $${Number(current_bid).toFixed(2)}`);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: item_id,
          buyer_login: username,
          bid_amount: parsedBid
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to process bid submission.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
      
      // Deliberate minor timeout so user catches the visual confirmation before sliding home
      setTimeout(() => {
        navigate("/Home", { state: { username: username } });
      }, 1800);

    } catch (error) {
      setError("Unable to communicate with the database server.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ fontFamily: "'DM Sans', sans-serif", background: "#fafbff" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Sora:wght@600;700&display=swap" rel="stylesheet" />
      
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-2xl p-8 shadow-xs">
        <button onClick={() => navigate("/Home", { state: { username: username } })} className="text-xs text-slate-400 hover:text-slate-600 font-medium mb-6 flex items-center gap-1.5 transition-colors">
          ← Back to Marketplace
        </button>

        {success ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4 font-bold text-lg">✓</div>
            <h3 className="text-lg font-bold mb-1" style={{ color: DARK_BLUE, fontFamily: "'Sora', sans-serif" }}>Bid Recorded!</h3>
            <p className="text-slate-400 text-xs">Your offer has been submitted securely into the ledger.</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
              <img src={image_url} alt={item_name} className="w-16 h-16 object-cover rounded-xl bg-slate-50" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Live Auction Entry</span>
                <h2 className="text-base font-bold line-clamp-1" style={{ color: DARK_BLUE }}>{item_name}</h2>
                <p className="text-sm font-semibold mt-0.5" style={{ color: ACCENT_BLUE }}>Current Price: ${Number(current_bid).toFixed(2)}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: DARK_BLUE }}>Your Bid Amount ($)</label>
                  <span className="text-[11px] text-slate-400 font-medium">Bidding as: <span className="font-semibold text-slate-600">@{username}</span></span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-slate-400 font-medium text-sm">$</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    required
                    value={bidAmount} 
                    onChange={(e) => { setBidAmount(e.target.value); setError(null); }}
                    placeholder={(parseFloat(current_bid) + 1.00).toFixed(2)} 
                    className="w-full h-11.5 pl-8 pr-4 text-sm rounded-xl border outline-none bg-white font-medium"
                    style={{ border: `1.5px solid ${error ? "#f87171" : "#dde3f0"}` }}
                  />
                </div>
                {error && (
                  <p className="mt-2 text-xs text-red-500 flex items-start gap-1">
                    <span>⚠️</span> {error}
                  </p>
                )}
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-11 flex items-center justify-center font-semibold text-xs text-white rounded-xl transition-all shadow-xs" 
                style={{ background: DARK_BLUE }}
              >
                {loading ? "Transacting Entry..." : "Submit Bid"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}