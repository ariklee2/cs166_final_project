import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface CheckoutSuccessData {
  message: string;
  payment_id: number;
  shipment_id: number;
  tracking_number: string;
}

export function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract properties safely from home card navigate context
  const { item_id, item_name, final_price, username } = location.state || {};

  const [savedAddress, setSavedAddress] = useState<string>("");
  const [customAddress, setCustomAddress] = useState<string>("");
  const [useCustomAddress, setUseCustomAddress] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingAddress, setFetchingAddress] = useState<boolean>(true);
  const [successData, setSuccessData] = useState<CheckoutSuccessData | null>(null);

  const DARK_BLUE = "#0f2d5c";

  // Fetch saved account address
  useEffect(() => {
    if (!username) return;

    const fetchUserAddress = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:5000/api/user/profile?username=${username}`);
        if (response.ok) {
          const data = await response.json();
          setSavedAddress(data.address || "No saved address found.");
        }
      } catch (err) {
        console.error("Error fetching account address ledger:", err);
      } finally {
        setFetchingAddress(false);
      }
    };

    fetchUserAddress();
  }, [username]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Choose which address parameter to dispatch to Flask
    const finalAddress = useCustomAddress ? customAddress : savedAddress;

    if (!finalAddress.trim()) {
      alert("Please provide or select a valid shipping address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/checkout/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: item_id,
          buyer_login: username,
          address: finalAddress,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessData(data);
      } else {
        alert(data.error || "Failed to process order checkout.");
      }
    } catch (err) {
      console.error("Checkout submission failure:", err);
      alert("Could not connect to database server.");
    } finally {
      setLoading(false);
    }
  };

  if (!item_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xs border border-slate-100">
          <p className="text-slate-500 mb-4">No active checkout context found.</p>
          <button 
            onClick={() => navigate("/home")}
            className="px-4 py-2 text-xs font-semibold text-white rounded-xl" 
            style={{ background: DARK_BLUE }}
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbff]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <main className="flex-1 max-w-xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-xs">
          
          {!successData ? (
            <>
              <h2 className="text-2xl font-bold mb-1" style={{ color: DARK_BLUE }}>Secure Checkout</h2>
              <p className="text-slate-400 text-sm mb-6">Review your winning item ledger parameters</p>

              <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-2 text-sm border border-slate-100">
                <div className="flex justify-between"><span className="text-slate-500">Item Name:</span><span className="font-semibold text-slate-800">{item_name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Buyer Account:</span><span className="font-semibold text-slate-800">@{username}</span></div>
                <div className="border-t border-slate-200/60 my-2 pt-2 flex justify-between text-base font-bold">
                  <span style={{ color: DARK_BLUE }}>Total Due:</span>
                  <span style={{ color: DARK_BLUE }}>${Number(final_price).toFixed(2)}</span>
                </div>
              </div>

              <form onSubmit={handlePlaceOrder} className="space-y-6">
                
                {/* ADDRESS SELECTOR */}
                <div>
                  <label className="block text-xs font-semibold mb-3 uppercase tracking-wide text-slate-600">Shipping Delivery Destination</label>
                  
                  {fetchingAddress ? (
                    <p className="text-xs text-slate-400 italic">Retrieving profile parameters...</p>
                  ) : (
                    <div className="space-y-3">
                      
                      {/* Option 1: Saved Account Address */}
                      <label className={`block p-4 rounded-xl border transition-all cursor-pointer ${!useCustomAddress ? "border-blue-500 bg-blue-50/20" : "border-slate-200 bg-white"}`}>
                        <div className="flex items-start gap-3">
                          <input 
                            type="radio" 
                            name="address_option" 
                            checked={!useCustomAddress} 
                            onChange={() => setUseCustomAddress(false)}
                            className="mt-1 accent-blue-600"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-700 block mb-0.5">Use Account Default Address</span>
                            <span className="text-sm text-slate-500">{savedAddress}</span>
                          </div>
                        </div>
                      </label>

                      {/* Option 2: Alternate Custom Address */}
                      <label className={`block p-4 rounded-xl border transition-all cursor-pointer ${useCustomAddress ? "border-blue-500 bg-blue-50/20" : "border-slate-200 bg-white"}`}>
                        <div className="flex items-start gap-3">
                          <input 
                            type="radio" 
                            name="address_option" 
                            checked={useCustomAddress} 
                            onChange={() => setUseCustomAddress(true)}
                            className="mt-1 accent-blue-600"
                          />
                          <div className="w-full">
                            <span className="text-xs font-bold text-slate-700 block mb-2">Ship to an Alternate Address</span>
                            {useCustomAddress && (
                              <textarea 
                                value={customAddress} 
                                onChange={(e) => setCustomAddress(e.target.value)} 
                                placeholder="Enter completely distinct shipping destination details..." 
                                rows={2} 
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none resize-none focus:border-blue-500 bg-white"
                                disabled={loading}
                              />
                            )}
                          </div>
                        </div>
                      </label>

                    </div>
                  )}
                </div>

                {/* CONTROL BUTTON ACTIONS */}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => navigate(-1)} className="flex-1 h-12 text-sm font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading || fetchingAddress} className="flex-2 h-12 text-sm font-semibold text-white rounded-xl shadow-xs transition-opacity disabled:opacity-60" style={{ background: DARK_BLUE }}>
                    {loading ? "Processing Ledger..." : "Authorize & Place Order"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* SUCCESS VIEW */
            <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-3xl mx-auto">🎉</div>
                <h2 className="text-2xl font-bold" style={{ color: DARK_BLUE }}>Order Confirmed!</h2>
                <p className="text-slate-400 text-sm max-w-sm mx-auto">Your payment went through!.</p>
              
                <div className="bg-slate-50 rounded-xl p-4 text-left text-xs font-mono space-y-1.5 text-slate-600 border border-slate-100">
                    <div>Payment ID:  {successData.payment_id}</div>
                    <div>Shipment ID: {successData.shipment_id}</div>
                    <div>Tracking #:  <span className="font-bold text-slate-800">{successData.tracking_number}</span></div>
                    <div>Status:      <span className="text-amber-600 font-semibold">Pending Shipment Delivery</span></div>
                </div>

                <button 
                    onClick={() => navigate("/home", { state: { username: username } })} 
                    className="w-full h-11 text-sm font-semibold text-white rounded-xl transition-transform" 
                    style={{ background: DARK_BLUE }}
                    >
                    Return to Marketplace Discover
                </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}