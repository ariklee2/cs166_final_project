import { useLocation, useNavigate } from "react-router-dom";

export function Shipping() {
  const location = useLocation();
  const navigate = useNavigate();

  const { 
    item_name, 
    current_bid, 
    tracking_number, 
    shipment_status, 
    shipping_address, 
    winner_login, 
    seller_login,
    username 
  } = location.state || {};

  const DARK_BLUE = "#0f2d5c";

  if (!tracking_number) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xs border border-slate-100">
          <p className="text-slate-500 mb-4">No tracking records found for this resource.</p>
          <button onClick={() => navigate("/home", { state: { username } })} className="px-4 py-2 text-xs font-semibold text-white rounded-xl" style={{ background: DARK_BLUE }}>Return Home</button>
        </div>
      </div>
    );
  }

  // Determine styling color variations for status conditions matching your constraints
  const getStatusColor = (status: string) => {
    if (status === "Delivered") return { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" };
    if (status === "Shipped") return { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" };
    return { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" };
  };

  const statusStyle = getStatusColor(shipment_status || "Pending");

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbff]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <main className="flex-1 max-w-xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-xs space-y-6">
          
          <div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: DARK_BLUE }}>Shipping Tracker</h2>
            <p className="text-slate-400 text-sm">Relational fulfillment database tracking parameters</p>
          </div>

          {/* CORE STATUS BLOCK */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${statusStyle.bg} ${statusStyle.border}`}>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-0.5">Fulfillment Status</p>
              <p className={`text-base font-bold ${statusStyle.text}`}>{shipment_status || "Pending"}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-0.5">Tracking Number</p>
              <p className="text-sm font-mono font-bold text-slate-700">{tracking_number}</p>
            </div>
          </div>

          {/* PACKAGE DETAILS MATRIX */}
          <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 text-sm bg-slate-50/50">
            <div className="p-4 flex justify-between"><span className="text-slate-500">Item Description:</span><span className="font-semibold text-slate-800">{item_name}</span></div>
            <div className="p-4 flex justify-between"><span className="text-slate-500">Transaction Value:</span><span className="font-semibold text-slate-800">${Number(current_bid).toFixed(2)}</span></div>
            <div className="p-4 flex justify-between"><span className="text-slate-500">Seller:</span><span className="font-semibold text-slate-700">@{seller_login}</span></div>
            <div className="p-4 flex justify-between"><span className="text-slate-500">Buyer:</span><span className="font-semibold text-slate-700">@{winner_login}</span></div>
          </div>

          {/* DELIVERY ADDRESS FIELD */}
          <div className="bg-white border border-slate-100 p-4 rounded-xl">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1.5">Destination Address</p>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{shipping_address}</p>
          </div>

          <button 
            onClick={() => navigate("/home", { state: { username } })} 
            className="w-full h-12 text-sm font-semibold text-white rounded-xl shadow-xs hover:opacity-95 transition-opacity" 
            style={{ background: DARK_BLUE }}
          >
            Return to Marketplace Discover
          </button>

        </div>
      </main>
    </div>
  );
}