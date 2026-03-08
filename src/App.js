import { useState, useEffect, useRef } from "react";

// ── MOCK DATA ────────────────────────────────────────────────────────────────
const ADMIN_CREDS = { username: "admin", password: "gcanteen2025" };

const INITIAL_PRODUCTS = [
  { id: 1, name: "OG Kush", type: "Flower", thc: "24%", price: 350, unit: "3.5g", stock: 12, badge: "🔥 Best Seller", img: "🌿" },
  { id: 2, name: "Blue Dream", type: "Flower", thc: "21%", price: 280, unit: "3.5g", stock: 8, badge: "💎 Premium", img: "💙" },
  { id: 3, name: "Mango Haze", type: "Pre-Roll", thc: "19%", price: 120, unit: "1g", stock: 20, badge: "🆕 New", img: "🥭" },
  { id: 4, name: "Gelato #33", type: "Concentrate", thc: "78%", price: 600, unit: "1g", stock: 5, badge: "⭐ Limited", img: "🍦" },
  { id: 5, name: "Sunset Sherbet", type: "Edible", thc: "10mg", price: 180, unit: "10pk", stock: 15, badge: "😌 Mellow", img: "🌅" },
  { id: 6, name: "Purple Punch", type: "Flower", thc: "22%", price: 320, unit: "3.5g", stock: 7, badge: "🍇 Indica", img: "🟣" },
];

const SPECIALS = [
  { label: "Today's Deal", desc: "Blue Dream 7g for ₹499 (save ₹61)", color: "#00ff88" },
  { label: "Flash Sale", desc: "Mango Haze Pre-Rolls — Buy 3 Get 1 Free", color: "#ff6b35" },
  { label: "VIP Special", desc: "Gelato Concentrate — Free delivery today", color: "#c084fc" },
];

const INITIAL_USERS = [
  { id: 1, username: "shadow_leaf", email: "s@pm.me", status: "approved", joined: "2025-12-01", orders: 4 },
  { id: 2, username: "greenthumb99", email: "g@pm.me", status: "pending", joined: "2026-01-15", orders: 0 },
  { id: 3, username: "haze_rider", email: "h@pm.me", status: "approved", joined: "2025-11-20", orders: 11 },
  { id: 4, username: "kush_queen", email: "k@pm.me", status: "pending", joined: "2026-02-03", orders: 0 },
  { id: 5, username: "vapor_wolf", email: "v@pm.me", status: "rejected", joined: "2026-01-28", orders: 0 },
];

// ── VANISHING CHAT MESSAGES ──────────────────────────────────────────────────
const VANISH_SECONDS = 30;

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("landing"); // landing | home | checkout | admin | chat
  const [authState, setAuthState] = useState("guest"); // guest | requesting | approved | admin
  const [currentUser, setCurrentUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [products] = useState(INITIAL_PRODUCTS);
  const [adminTab, setAdminTab] = useState("users");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", email: "", password: "", invite: "" });
  const [loginError, setLoginError] = useState("");
  const [showAuth, setShowAuth] = useState("login"); // login | register
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, from: "Admin", text: "Welcome. This channel auto-deletes. Stay discrete. 🌿", ts: Date.now() - 60000, fadeAt: null },
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatRef = useRef(null);

  // Vanishing text timer
  useEffect(() => {
    const interval = setInterval(() => {
      setChatMessages(prev =>
        prev
          .map(m => {
            if (!m.fadeAt) return { ...m, fadeAt: m.ts + VANISH_SECONDS * 1000 };
            return m;
          })
          .filter(m => Date.now() < m.fadeAt + 3000)
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatMessages]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const handleLogin = () => {
    if (loginForm.username === ADMIN_CREDS.username && loginForm.password === ADMIN_CREDS.password) {
      setAuthState("admin");
      setCurrentUser({ username: "admin", role: "admin" });
      setPage("admin");
      setLoginError("");
      return;
    }
    const user = users.find(u => u.username === loginForm.username);
    if (!user) { setLoginError("User not found."); return; }
    if (user.status === "pending") { setLoginError("Your access request is pending admin approval."); return; }
    if (user.status === "rejected") { setLoginError("Your access has been denied. Contact support."); return; }
    setAuthState("approved");
    setCurrentUser(user);
    setPage("home");
    setLoginError("");
  };

  const handleRegister = () => {
    if (!registerForm.username || !registerForm.email) { setLoginError("Fill all fields."); return; }
    const newUser = {
      id: users.length + 1,
      username: registerForm.username,
      email: registerForm.email,
      status: "pending",
      joined: new Date().toISOString().slice(0, 10),
      orders: 0,
    };
    setUsers(prev => [...prev, newUser]);
    setLoginError("✅ Request submitted. Await admin approval.");
  };

  const handleUserAction = (id, action) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: action === "remove" ? "removed" : action } : u).filter(u => u.status !== "removed"));
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg = { id: Date.now(), from: currentUser?.username || "You", text: chatInput, ts: Date.now(), fadeAt: Date.now() + VANISH_SECONDS * 1000 };
    setChatMessages(prev => [...prev, msg]);
    setChatInput("");
  };

  const placeOrder = () => {
    setOrderPlaced(true);
    setCart([]);
    setTimeout(() => { setOrderPlaced(false); setPage("home"); }, 3000);
  };

  // ── STYLES ────────────────────────────────────────────────────────────────
  const S = {
    app: { fontFamily: "'Courier New', monospace", background: "#050a05", color: "#c8f0c8", minHeight: "100vh", position: "relative", overflow: "hidden" },
    noise: { position: "fixed", inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")", pointerEvents: "none", zIndex: 0 },
    nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", borderBottom: "1px solid #1a3a1a", background: "rgba(5,10,5,0.95)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 },
    logo: { fontSize: "1.4rem", fontWeight: "bold", letterSpacing: "0.3em", color: "#00ff88", textShadow: "0 0 20px #00ff8866", cursor: "pointer" },
    navLinks: { display: "flex", gap: "24px", alignItems: "center" },
    navBtn: (active) => ({ background: active ? "#00ff8820" : "transparent", border: `1px solid ${active ? "#00ff88" : "#1a3a1a"}`, color: active ? "#00ff88" : "#7aaa7a", padding: "6px 16px", cursor: "pointer", fontSize: "0.75rem", letterSpacing: "0.15em", transition: "all 0.2s" }),
    cartBadge: { background: "#00ff88", color: "#000", borderRadius: "50%", width: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: "bold", marginLeft: 4 },
    page: { position: "relative", zIndex: 1 },
  };

  const NavBar = () => (
    <nav style={S.nav}>
      <span style={S.logo} onClick={() => authState !== "guest" && setPage("home")}>G-CANTEEN</span>
      <div style={S.navLinks}>
        {authState !== "guest" && <>
          <button style={S.navBtn(page === "home")} onClick={() => setPage("home")}>SHOP</button>
          <button style={S.navBtn(page === "chat")} onClick={() => setPage("chat")}>SECURE CHAT</button>
          <button style={S.navBtn(page === "checkout")} onClick={() => setPage("checkout")}>
            CART {cart.length > 0 && <span style={S.cartBadge}>{cart.length}</span>}
          </button>
          {authState === "admin" && <button style={S.navBtn(page === "admin")} onClick={() => setPage("admin")}>ADMIN</button>}
          <button style={{ ...S.navBtn(false), borderColor: "#ff4444", color: "#ff6666" }} onClick={() => { setAuthState("guest"); setCurrentUser(null); setPage("landing"); setCart([]); }}>EXIT</button>
        </>}
      </div>
    </nav>
  );

  // ── LANDING PAGE ──────────────────────────────────────────────────────────
  const LandingPage = () => (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center" }}>
      <div style={{ fontSize: "0.7rem", letterSpacing: "0.5em", color: "#3a6a3a", marginBottom: 40 }}>PRIVATE ACCESS ONLY · INVITATION REQUIRED</div>
      <div style={{ fontSize: "clamp(3rem, 10vw, 7rem)", fontWeight: "900", letterSpacing: "0.1em", lineHeight: 1, color: "#00ff88", textShadow: "0 0 60px #00ff8840, 0 0 120px #00ff8820", marginBottom: 16 }}>G-CANTEEN</div>
      <div style={{ fontSize: "0.85rem", color: "#4a7a4a", letterSpacing: "0.3em", marginBottom: 60 }}>PREMIUM · EXCLUSIVE · DISCREET</div>

      <div style={{ width: 1, height: 60, background: "linear-gradient(to bottom, transparent, #00ff88, transparent)", marginBottom: 60 }} />

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={() => { setShowAuth("login"); setPage("auth"); }} style={{ padding: "14px 40px", background: "#00ff8815", border: "1px solid #00ff88", color: "#00ff88", fontSize: "0.8rem", letterSpacing: "0.3em", cursor: "pointer", transition: "all 0.3s" }}>
          MEMBER LOGIN
        </button>
        <button onClick={() => { setShowAuth("register"); setPage("auth"); }} style={{ padding: "14px 40px", background: "transparent", border: "1px solid #2a4a2a", color: "#4a7a4a", fontSize: "0.8rem", letterSpacing: "0.3em", cursor: "pointer" }}>
          REQUEST ACCESS
        </button>
      </div>

      <div style={{ marginTop: 80, display: "flex", gap: 60, color: "#2a4a2a", fontSize: "0.7rem", letterSpacing: "0.2em" }}>
        <span>🔒 END-TO-END ENCRYPTED</span>
        <span>👁 NO LOGS KEPT</span>
        <span>💨 VANISHING MESSAGES</span>
      </div>
    </div>
  );

  // ── AUTH PAGE ─────────────────────────────────────────────────────────────
  const AuthPage = () => (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400, border: "1px solid #1a3a1a", padding: "40px", background: "#080f08" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: "1.5rem", color: "#00ff88", letterSpacing: "0.4em", marginBottom: 8 }}>G-CANTEEN</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 0 }}>
            {["login", "register"].map(tab => (
              <button key={tab} onClick={() => { setShowAuth(tab); setLoginError(""); }} style={{ flex: 1, padding: "8px", background: showAuth === tab ? "#00ff8815" : "transparent", border: "1px solid #1a3a1a", color: showAuth === tab ? "#00ff88" : "#3a5a3a", fontSize: "0.7rem", letterSpacing: "0.2em", cursor: "pointer" }}>
                {tab === "login" ? "SIGN IN" : "REQUEST ACCESS"}
              </button>
            ))}
          </div>
        </div>

        {showAuth === "login" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input placeholder="Username" value={loginForm.username} onChange={e => setLoginForm(p => ({ ...p, username: e.target.value }))} style={{ background: "#0a120a", border: "1px solid #1a3a1a", color: "#c8f0c8", padding: "10px 14px", fontSize: "0.85rem", outline: "none" }} />
            <input type="password" placeholder="Password" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} onKeyDown={e => e.key === "Enter" && handleLogin()} style={{ background: "#0a120a", border: "1px solid #1a3a1a", color: "#c8f0c8", padding: "10px 14px", fontSize: "0.85rem", outline: "none" }} />
            {loginError && <div style={{ color: loginError.startsWith("✅") ? "#00ff88" : "#ff6666", fontSize: "0.75rem" }}>{loginError}</div>}
            <button onClick={handleLogin} style={{ marginTop: 8, padding: "12px", background: "#00ff8820", border: "1px solid #00ff88", color: "#00ff88", fontSize: "0.8rem", letterSpacing: "0.3em", cursor: "pointer" }}>ENTER</button>
            <div style={{ fontSize: "0.65rem", color: "#2a4a2a", textAlign: "center", marginTop: 8 }}>Admin: admin / gcanteen2025</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input placeholder="Choose username" value={registerForm.username} onChange={e => setRegisterForm(p => ({ ...p, username: e.target.value }))} style={{ background: "#0a120a", border: "1px solid #1a3a1a", color: "#c8f0c8", padding: "10px 14px", fontSize: "0.85rem", outline: "none" }} />
            <input placeholder="Encrypted email" value={registerForm.email} onChange={e => setRegisterForm(p => ({ ...p, email: e.target.value }))} style={{ background: "#0a120a", border: "1px solid #1a3a1a", color: "#c8f0c8", padding: "10px 14px", fontSize: "0.85rem", outline: "none" }} />
            <input type="password" placeholder="Set passphrase" value={registerForm.password} onChange={e => setRegisterForm(p => ({ ...p, password: e.target.value }))} style={{ background: "#0a120a", border: "1px solid #1a3a1a", color: "#c8f0c8", padding: "10px 14px", fontSize: "0.85rem", outline: "none" }} />
            {loginError && <div style={{ color: loginError.startsWith("✅") ? "#00ff88" : "#ff6666", fontSize: "0.75rem" }}>{loginError}</div>}
            <button onClick={handleRegister} style={{ marginTop: 8, padding: "12px", background: "#00440020", border: "1px solid #2a5a2a", color: "#4a9a4a", fontSize: "0.8rem", letterSpacing: "0.3em", cursor: "pointer" }}>SUBMIT REQUEST</button>
            <div style={{ fontSize: "0.65rem", color: "#2a4a2a", textAlign: "center" }}>Requests reviewed manually by admin</div>
          </div>
        )}
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <button onClick={() => setPage("landing")} style={{ background: "none", border: "none", color: "#2a4a2a", cursor: "pointer", fontSize: "0.7rem" }}>← BACK</button>
        </div>
      </div>
    </div>
  );

  // ── HOME / SHOP PAGE ───────────────────────────────────────────────────────
  const HomePage = () => (
    <div style={{ padding: "32px 24px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Specials Banner */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: "0.65rem", letterSpacing: "0.4em", color: "#3a6a3a", marginBottom: 16 }}>TODAY'S SPECIALS</div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {SPECIALS.map((s, i) => (
            <div key={i} style={{ flex: "1 1 240px", border: `1px solid ${s.color}30`, background: `${s.color}08`, padding: "16px 20px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: s.color }} />
              <div style={{ fontSize: "0.65rem", letterSpacing: "0.3em", color: s.color, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: "0.85rem", color: "#c8f0c8" }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Products */}
      <div style={{ fontSize: "0.65rem", letterSpacing: "0.4em", color: "#3a6a3a", marginBottom: 20 }}>AVAILABLE STOCK</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
        {products.map(p => (
          <div key={p.id} style={{ border: "1px solid #1a3a1a", background: "#080f08", padding: "20px", transition: "border-color 0.2s", position: "relative" }}>
            <div style={{ position: "absolute", top: 12, right: 12, fontSize: "0.6rem", color: "#00ff88", background: "#00ff8812", padding: "3px 8px", border: "1px solid #00ff8830" }}>{p.badge}</div>
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>{p.img}</div>
            <div style={{ fontSize: "1rem", fontWeight: "bold", color: "#e0ffe0", marginBottom: 4 }}>{p.name}</div>
            <div style={{ fontSize: "0.7rem", color: "#4a7a4a", marginBottom: 4, letterSpacing: "0.1em" }}>{p.type} · THC {p.thc}</div>
            <div style={{ fontSize: "0.7rem", color: "#3a5a3a", marginBottom: 16 }}>Stock: {p.stock} units</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: "1.2rem", color: "#00ff88", fontWeight: "bold" }}>₹{p.price}</span>
                <span style={{ fontSize: "0.7rem", color: "#3a5a3a" }}> / {p.unit}</span>
              </div>
              <button onClick={() => addToCart(p)} style={{ padding: "8px 16px", background: "#00ff8818", border: "1px solid #00ff8850", color: "#00ff88", fontSize: "0.7rem", letterSpacing: "0.15em", cursor: "pointer" }}>
                + ADD
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── CHECKOUT PAGE ─────────────────────────────────────────────────────────
  const CheckoutPage = () => (
    <div style={{ padding: "32px 24px", maxWidth: 700, margin: "0 auto" }}>
      <div style={{ fontSize: "0.65rem", letterSpacing: "0.4em", color: "#3a6a3a", marginBottom: 24 }}>SECURE CHECKOUT · ENCRYPTED</div>

      {orderPlaced ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>✅</div>
          <div style={{ color: "#00ff88", fontSize: "1.2rem", letterSpacing: "0.2em" }}>ORDER CONFIRMED</div>
          <div style={{ color: "#4a7a4a", fontSize: "0.75rem", marginTop: 8 }}>Your order has been received. Redirecting...</div>
        </div>
      ) : cart.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#2a4a2a" }}>
          <div style={{ fontSize: "2rem", marginBottom: 12 }}>🛒</div>
          <div style={{ letterSpacing: "0.2em" }}>CART IS EMPTY</div>
          <button onClick={() => setPage("home")} style={{ marginTop: 20, padding: "10px 24px", background: "transparent", border: "1px solid #2a4a2a", color: "#4a7a4a", cursor: "pointer", fontSize: "0.75rem", letterSpacing: "0.2em" }}>BROWSE STOCK</button>
        </div>
      ) : (
        <>
          <div style={{ border: "1px solid #1a3a1a", marginBottom: 24 }}>
            {cart.map(item => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #0f1f0f" }}>
                <div>
                  <div style={{ color: "#c8f0c8", fontSize: "0.9rem" }}>{item.img} {item.name}</div>
                  <div style={{ color: "#3a5a3a", fontSize: "0.7rem" }}>₹{item.price} × {item.qty}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ color: "#00ff88" }}>₹{item.price * item.qty}</span>
                  <button onClick={() => removeFromCart(item.id)} style={{ background: "none", border: "none", color: "#ff4444", cursor: "pointer", fontSize: "0.8rem" }}>✕</button>
                </div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 20px", background: "#0a140a" }}>
              <span style={{ letterSpacing: "0.2em", fontSize: "0.75rem" }}>TOTAL</span>
              <span style={{ color: "#00ff88", fontSize: "1.1rem", fontWeight: "bold" }}>₹{cartTotal}</span>
            </div>
          </div>

          <div style={{ border: "1px solid #1a3a1a", padding: "24px", marginBottom: 24, background: "#080f08" }}>
            <div style={{ fontSize: "0.65rem", letterSpacing: "0.3em", color: "#3a6a3a", marginBottom: 16 }}>DELIVERY INFO (ENCRYPTED)</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input placeholder="Alias / Codename" style={{ background: "#0a120a", border: "1px solid #1a3a1a", color: "#c8f0c8", padding: "10px 14px", fontSize: "0.85rem", outline: "none" }} />
              <input placeholder="Drop zone / Location hint" style={{ background: "#0a120a", border: "1px solid #1a3a1a", color: "#c8f0c8", padding: "10px 14px", fontSize: "0.85rem", outline: "none" }} />
              <select style={{ background: "#0a120a", border: "1px solid #1a3a1a", color: "#c8f0c8", padding: "10px 14px", fontSize: "0.85rem", outline: "none" }}>
                <option>Payment: Crypto (preferred)</option>
                <option>Payment: Cash on delivery</option>
              </select>
            </div>
          </div>

          <button onClick={placeOrder} style={{ width: "100%", padding: "16px", background: "#00ff8820", border: "1px solid #00ff88", color: "#00ff88", fontSize: "0.85rem", letterSpacing: "0.4em", cursor: "pointer" }}>
            CONFIRM ORDER
          </button>
          <div style={{ textAlign: "center", marginTop: 12, fontSize: "0.65rem", color: "#2a4a2a" }}>🔒 Order details auto-purge after 24h</div>
        </>
      )}
    </div>
  );

  // ── SECURE CHAT PAGE ──────────────────────────────────────────────────────
  const ChatPage = () => (
    <div style={{ padding: "24px", maxWidth: 700, margin: "0 auto", height: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: "0.65rem", letterSpacing: "0.4em", color: "#3a6a3a" }}>SECURE CHANNEL · VANISHING MESSAGES</div>
          <div style={{ fontSize: "0.7rem", color: "#2a4a2a", marginTop: 4 }}>Messages self-destruct after {VANISH_SECONDS}s · No logs · No screenshots</div>
        </div>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 8px #00ff88" }} />
      </div>

      <div ref={chatRef} style={{ flex: 1, overflowY: "auto", border: "1px solid #1a3a1a", padding: "16px", background: "#050a05", display: "flex", flexDirection: "column", gap: 12 }}>
        {chatMessages.map(msg => {
          const remaining = msg.fadeAt ? Math.max(0, (msg.fadeAt - Date.now()) / 1000) : VANISH_SECONDS;
          const opacity = remaining < 5 ? remaining / 5 : 1;
          const isMe = msg.from === (currentUser?.username || "You");
          return (
            <div key={msg.id} style={{ opacity, transition: "opacity 0.5s", alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "75%" }}>
              <div style={{ fontSize: "0.6rem", color: "#2a4a2a", marginBottom: 4, textAlign: isMe ? "right" : "left" }}>
                {msg.from} · {remaining > 0 ? `💨 ${Math.ceil(remaining)}s` : "vanished"}
              </div>
              <div style={{ background: isMe ? "#00ff8815" : "#0f1f0f", border: `1px solid ${isMe ? "#00ff8830" : "#1a3a1a"}`, padding: "10px 14px", fontSize: "0.85rem", color: "#c8f0c8" }}>
                {msg.text}
              </div>
            </div>
          );
        })}
        {chatMessages.length === 0 && <div style={{ color: "#1a3a1a", textAlign: "center", marginTop: 40, fontSize: "0.75rem", letterSpacing: "0.2em" }}>ALL MESSAGES VANISHED</div>}
      </div>

      <div style={{ display: "flex", gap: 0, marginTop: 12 }}>
        <input
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendChat()}
          placeholder="Type a vanishing message..."
          style={{ flex: 1, background: "#080f08", border: "1px solid #1a3a1a", borderRight: "none", color: "#c8f0c8", padding: "12px 16px", fontSize: "0.85rem", outline: "none" }}
        />
        <button onClick={sendChat} style={{ padding: "12px 24px", background: "#00ff8818", border: "1px solid #00ff8850", color: "#00ff88", cursor: "pointer", fontSize: "0.75rem", letterSpacing: "0.15em" }}>SEND</button>
      </div>
      <div style={{ fontSize: "0.6rem", color: "#1a3a1a", textAlign: "center", marginTop: 8 }}>⚠ Messages disappear in {VANISH_SECONDS} seconds. This conversation is not stored.</div>
    </div>
  );

  // ── ADMIN PAGE ────────────────────────────────────────────────────────────
  const AdminPage = () => {
    const pending = users.filter(u => u.status === "pending");
    const approved = users.filter(u => u.status === "approved");
    const rejected = users.filter(u => u.status === "rejected");

    const statusColor = { approved: "#00ff88", pending: "#ffaa00", rejected: "#ff4444" };

    return (
      <div style={{ padding: "32px 24px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: "0.65rem", letterSpacing: "0.4em", color: "#3a6a3a" }}>ADMIN CONSOLE</div>
            <div style={{ fontSize: "1.4rem", color: "#00ff88", marginTop: 4 }}>Control Panel</div>
          </div>
          <div style={{ display: "flex", gap: 20, fontSize: "0.75rem" }}>
            <div style={{ textAlign: "center" }}><div style={{ color: "#ffaa00", fontSize: "1.5rem", fontWeight: "bold" }}>{pending.length}</div><div style={{ color: "#3a5a3a" }}>PENDING</div></div>
            <div style={{ textAlign: "center" }}><div style={{ color: "#00ff88", fontSize: "1.5rem", fontWeight: "bold" }}>{approved.length}</div><div style={{ color: "#3a5a3a" }}>APPROVED</div></div>
            <div style={{ textAlign: "center" }}><div style={{ color: "#ff4444", fontSize: "1.5rem", fontWeight: "bold" }}>{rejected.length}</div><div style={{ color: "#3a5a3a" }}>REJECTED</div></div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 0, marginBottom: 24 }}>
          {["users", "stock", "orders"].map(tab => (
            <button key={tab} onClick={() => setAdminTab(tab)} style={{ flex: 1, padding: "10px", background: adminTab === tab ? "#00ff8815" : "transparent", border: "1px solid #1a3a1a", color: adminTab === tab ? "#00ff88" : "#3a5a3a", fontSize: "0.7rem", letterSpacing: "0.2em", cursor: "pointer" }}>
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {adminTab === "users" && (
          <div>
            {pending.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: "0.65rem", letterSpacing: "0.3em", color: "#ffaa00", marginBottom: 12 }}>⏳ PENDING APPROVAL ({pending.length})</div>
                {pending.map(u => (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", border: "1px solid #2a2a0a", marginBottom: 8, background: "#0f0f05" }}>
                    <div>
                      <span style={{ color: "#e0e080" }}>{u.username}</span>
                      <span style={{ color: "#3a3a20", fontSize: "0.75rem", marginLeft: 12 }}>{u.email}</span>
                      <span style={{ color: "#2a2a10", fontSize: "0.7rem", marginLeft: 12 }}>joined {u.joined}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleUserAction(u.id, "approved")} style={{ padding: "6px 16px", background: "#00ff8818", border: "1px solid #00ff8850", color: "#00ff88", cursor: "pointer", fontSize: "0.7rem" }}>APPROVE</button>
                      <button onClick={() => handleUserAction(u.id, "rejected")} style={{ padding: "6px 16px", background: "#ff444418", border: "1px solid #ff444450", color: "#ff6666", cursor: "pointer", fontSize: "0.7rem" }}>REJECT</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ fontSize: "0.65rem", letterSpacing: "0.3em", color: "#3a6a3a", marginBottom: 12 }}>ALL MEMBERS</div>
            {users.map(u => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", border: "1px solid #1a3a1a", marginBottom: 6, background: "#080f08" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor[u.status] || "#444", display: "inline-block" }} />
                  <span style={{ color: "#c8f0c8" }}>{u.username}</span>
                  <span style={{ color: "#3a5a3a", fontSize: "0.7rem" }}>{u.orders} orders</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: "0.65rem", color: statusColor[u.status] || "#444", letterSpacing: "0.1em" }}>{u.status.toUpperCase()}</span>
                  {u.status === "approved" && <button onClick={() => handleUserAction(u.id, "remove")} style={{ padding: "4px 12px", background: "#ff444410", border: "1px solid #ff444430", color: "#ff6666", cursor: "pointer", fontSize: "0.65rem" }}>REMOVE</button>}
                  {u.status === "rejected" && <button onClick={() => handleUserAction(u.id, "approved")} style={{ padding: "4px 12px", background: "#00ff8810", border: "1px solid #00ff8830", color: "#00ff88", cursor: "pointer", fontSize: "0.65rem" }}>REINSTATE</button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {adminTab === "stock" && (
          <div>
            <div style={{ fontSize: "0.65rem", letterSpacing: "0.3em", color: "#3a6a3a", marginBottom: 16 }}>LIVE INVENTORY</div>
            {products.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", border: "1px solid #1a3a1a", marginBottom: 6, background: "#080f08" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontSize: "1.2rem" }}>{p.img}</span>
                  <div>
                    <div style={{ color: "#c8f0c8" }}>{p.name}</div>
                    <div style={{ color: "#3a5a3a", fontSize: "0.7rem" }}>{p.type} · {p.unit}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <span style={{ color: "#00ff88" }}>₹{p.price}</span>
                  <span style={{ color: p.stock < 6 ? "#ff6644" : "#4a7a4a", fontSize: "0.75rem" }}>Stock: {p.stock}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {adminTab === "orders" && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#2a4a2a" }}>
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>📦</div>
            <div style={{ letterSpacing: "0.2em" }}>ORDER LOGS ENCRYPTED</div>
            <div style={{ fontSize: "0.7rem", marginTop: 8 }}>No order data retained beyond 24h per security policy</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={S.app}>
      <div style={S.noise} />
      <div style={S.page}>
        {page !== "landing" && <NavBar />}
        {page === "landing" && <LandingPage />}
        {page === "auth" && <AuthPage />}
        {page === "home" && <HomePage />}
        {page === "checkout" && <CheckoutPage />}
        {page === "chat" && <ChatPage />}
        {page === "admin" && <AdminPage />}
      </div>
    </div>
  );
}
