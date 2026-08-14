"use client";
/* eslint-disable @next/next/no-img-element -- Generated QR data URLs are intentionally rendered as printable images. */

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight, Check, ChevronDown, CircleCheck, Copy, Download, ExternalLink, Eye,
  Globe2, ImagePlus, LayoutDashboard, Leaf, Loader2, LogOut, Menu, Palette, Pencil, Plus,
  QrCode, RefreshCw, Search, Settings, ShieldCheck, Smartphone, Sparkles, Trash2, UploadCloud, UtensilsCrossed, X,
} from "lucide-react";
import QRCode from "qrcode";
import { supabase, supabaseConfigured } from "../lib/supabase";

type Restaurant = {
  id: string; owner_id: string; name: string; slug: string; description: string | null;
  location: string | null; currency: string; published: boolean; accent_color: string;
  logo_url: string | null; banner_url: string | null;
};
type Category = { id: string; restaurant_id: string; name: string; sort_order: number };
type MenuItem = {
  id: string; restaurant_id: string; category_id: string; name: string;
  description: string | null; price: number; available: boolean; vegetarian: boolean;
  vegan: boolean; spicy: boolean; sort_order: number; image_url: string | null;
};

const demoRestaurant: Restaurant = {
  id: "demo", owner_id: "demo", name: "Casa Luma", slug: "demo",
  description: "Mediterrane Küche, ehrliche Zutaten und ein bisschen Sonne auf jedem Teller.",
  location: "Chur, Schweiz", currency: "CHF", published: true, accent_color: "#ff5c35", logo_url: null, banner_url: null,
};
const demoCategories: Category[] = [
  { id: "c1", restaurant_id: "demo", name: "Zum Teilen", sort_order: 0 },
  { id: "c2", restaurant_id: "demo", name: "Hauptgerichte", sort_order: 1 },
  { id: "c3", restaurant_id: "demo", name: "Getränke", sort_order: 2 },
];
const demoItems: MenuItem[] = [
  { id: "i1", restaurant_id: "demo", category_id: "c1", name: "Burrata & Pfirsich", description: "Basilikumöl, geröstete Mandeln, Sauerteig", price: 18, available: true, vegetarian: true, vegan: false, spicy: false, sort_order: 0, image_url: null },
  { id: "i2", restaurant_id: "demo", category_id: "c1", name: "Luma Hummus", description: "Geröstete Kichererbsen, Za'atar, Fladenbrot", price: 14, available: true, vegetarian: true, vegan: true, spicy: false, sort_order: 1, image_url: null },
  { id: "i3", restaurant_id: "demo", category_id: "c2", name: "Zitronen-Risotto", description: "Erbsen, Pecorino, Minze", price: 27, available: true, vegetarian: true, vegan: false, spicy: false, sort_order: 0, image_url: null },
  { id: "i4", restaurant_id: "demo", category_id: "c2", name: "Harissa Poulet", description: "Couscous, Aprikose, Joghurt", price: 32, available: true, vegetarian: false, vegan: false, spicy: true, sort_order: 1, image_url: null },
  { id: "i5", restaurant_id: "demo", category_id: "c3", name: "Hausgemachte Limonade", description: "Zitrone, Rosmarin, wenig Zucker", price: 6.5, available: true, vegetarian: true, vegan: true, spicy: false, sort_order: 0, image_url: null },
  { id: "i6", restaurant_id: "demo", category_id: "c3", name: "Churer Stadtbier", description: "33 cl", price: 7, available: true, vegetarian: true, vegan: true, spicy: false, sort_order: 1, image_url: null },
];

const imageTypes=["image/jpeg","image/png","image/webp"];
function imageError(file:File){if(!imageTypes.includes(file.type))return"Bitte JPG, PNG oder WebP verwenden.";if(file.size>5*1024*1024)return"Das Bild darf maximal 5 MB gross sein.";return""}
async function uploadImage(file:File,ownerId:string,folder:string){const validation=imageError(file);if(validation)throw new Error(validation);const extension=file.name.split(".").pop()?.toLowerCase()||"jpg";const path=`${ownerId}/${folder}/${crypto.randomUUID()}.${extension}`;const{error}=await supabase!.storage.from("menu-assets").upload(path,file,{cacheControl:"3600",upsert:false});if(error)throw error;return supabase!.storage.from("menu-assets").getPublicUrl(path).data.publicUrl}
function useImagePreview(file:File|null,fallback:string|null){const url=useMemo(()=>file?URL.createObjectURL(file):fallback||"",[file,fallback]);useEffect(()=>()=>{if(file)URL.revokeObjectURL(url)},[file,url]);return url}

function money(value: number, currency: string) {
  return new Intl.NumberFormat("de-CH", { style: "currency", currency }).format(value);
}
function slugify(value: string) {
  return value.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
}
function route() {
  const hash = window.location.hash.replace(/^#/, "") || "/";
  if (hash.startsWith("/m/")) return { page: "menu", slug: hash.slice(3) };
  if (hash === "/dashboard") return { page: "dashboard", slug: "" };
  if (hash === "/login") return { page: "login", slug: "" };
  if (hash === "/how") return { page: "how", slug: "" };
  if (hash === "/features") return { page: "features", slug: "" };
  return { page: "home", slug: "" };
}

export default function Home() {
  const [current, setCurrent] = useState({ page: "home", slug: "" });
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    const sync = () => { setCurrent(route()); window.scrollTo({ top: 0, left: 0 }); }; sync();
    window.addEventListener("hashchange", sync); return () => window.removeEventListener("hashchange", sync);
  }, []);
  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setLoggedIn(Boolean(data.session)));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setLoggedIn(Boolean(session)));
    return () => listener.subscription.unsubscribe();
  }, []);
  if (current.page === "menu") return <PublicMenu slug={current.slug} />;
  if (current.page === "dashboard") return <Dashboard />;
  if (current.page === "login") return <Auth />;
  if (current.page === "how") return <HowItWorksPage loggedIn={loggedIn}/>;
  if (current.page === "features") return <FeaturesPage loggedIn={loggedIn}/>;
  return <Landing loggedIn={loggedIn} />;
}

function Logo({ inverse = false }: { inverse?: boolean }) {
  return <a className={`logo ${inverse ? "logo-inverse" : ""}`} href="#/" aria-label="Menuva Startseite"><span className="logo-mark"><UtensilsCrossed size={17} /></span>menuva</a>;
}

function MarketingNav({loggedIn,active}:{loggedIn:boolean;active?:"how"|"features"}) {
  return <nav className="nav marketing-nav"><Logo/><div className="nav-links"><a className={active==="how"?"active":""} href="#/how">So funktioniert&apos;s</a><a className={active==="features"?"active":""} href="#/features">Features</a>{loggedIn?<a className="button button-dark" href="#/dashboard"><LayoutDashboard size={16}/> Menü verwalten</a>:<><a className="button button-quiet" href="#/login">Anmelden</a><a className="button button-dark" href="#/login">Restaurant starten <ArrowRight size={16}/></a></>}</div></nav>
}

function Landing({ loggedIn }: { loggedIn: boolean }) {
  return <main className="landing">
    <MarketingNav loggedIn={loggedIn}/>
    <section className="hero shell">
      <div className="hero-copy"><div className="eyebrow"><Sparkles size={14} /> Kostenlos · Open Source · Ohne Provision</div><h1>Deine Speisekarte.<br/><em>Einfach digital.</em></h1><p>Erstelle in Minuten eine schöne, mobile Menükarte. Änderungen sind sofort online – ohne App-Download, ohne Monatsabo.</p><div className="hero-actions"><a className="button button-primary button-large" href={loggedIn ? "#/dashboard" : "#/login"}>{loggedIn ? <><LayoutDashboard size={18}/> Menü verwalten</> : <>Kostenlos loslegen <ArrowRight size={18}/></>}</a><a className="text-link" href="#/m/demo">Beispielmenü ansehen <ExternalLink size={15}/></a></div><div className="trust-row"><span><Check size={15}/> Unbegrenzt Gerichte</span><span><Check size={15}/> Eigener QR-Code</span><span><Check size={15}/> Immer kostenlos</span></div></div>
      <div className="hero-visual" aria-label="Vorschau einer digitalen Speisekarte"><div className="sun-shape"/><div className="leaf leaf-one">◆</div><div className="leaf leaf-two">◆</div><div className="phone"><div className="phone-bar"><span>9:41</span><span>● ● ▰</span></div><div className="phone-menu"><span className="tiny-label">CASA LUMA</span><h3>Heute wird&apos;s<br/>richtig gut.</h3><div className="phone-tabs"><b>Beliebt</b><span>Lunch</span><span>Drinks</span></div><div className="dish"><div className="dish-art art-one">🍋</div><div><b>Zitronen-Risotto</b><small>Erbsen · Pecorino · Minze</small><strong>CHF 27.–</strong></div></div><div className="dish"><div className="dish-art art-two">🌶️</div><div><b>Harissa Poulet</b><small>Couscous · Aprikose</small><strong>CHF 32.–</strong></div></div></div></div><div className="float-card qr-float"><QrCode size={33}/><div><b>Scannen.</b><span>Geniessen.</span></div></div><div className="float-card update-float"><CircleCheck size={22}/><div><b>Menü aktualisiert</b><span>Gerade eben</span></div></div>
      </div>
    </section>
    <section className="ticker"><div>Speisen <span>✦</span> Getränke <span>✦</span> Tageskarten <span>✦</span> Desserts <span>✦</span> Cocktails <span>✦</span> Speisen <span>✦</span> Getränke</div></section>
    <section className="steps shell" id="how"><div className="section-kicker">SO EINFACH GEHT&apos;S</div><h2>Vom leeren Teller zur<br/>fertigen Menükarte.</h2><div className="step-grid"><article><span>01</span><div className="step-icon"><UtensilsCrossed/></div><h3>Restaurant erstellen</h3><p>Name, Beschreibung und Standort eintragen. Das dauert weniger als eine Minute.</p></article><article><span>02</span><div className="step-icon"><Plus/></div><h3>Menü befüllen</h3><p>Kategorien, Speisen und Getränke hinzufügen – inklusive Preisen und Eigenschaften.</p></article><article><span>03</span><div className="step-icon"><Globe2/></div><h3>Teilen & servieren</h3><p>Veröffentlichen, Link oder QR-Code teilen und Änderungen jederzeit live stellen.</p></article></div></section>
    <section className="features" id="features"><div className="shell feature-inner"><div><div className="section-kicker light">FÜR GASTGEBER GEMACHT</div><h2>Weniger verwalten.<br/><i>Mehr bewirten.</i></h2></div><div className="feature-list"><div><span>✦</span><div><h3>Blitzschnell aktualisiert</h3><p>Ausverkauft? Ein Klick, und das Gericht verschwindet sofort für Gäste.</p></div></div><div><span>✦</span><div><h3>Auf jedem Gerät schön</h3><p>Die Karte passt sich automatisch an Smartphone, Tablet und Desktop an.</p></div></div><div><span>✦</span><div><h3>Dein Restaurant, dein Stil</h3><p>Akzentfarbe, Beschreibung und Kategorien machen jede Karte eigenständig.</p></div></div></div></div></section>
    <section className="cta shell"><div><span className="section-kicker">BEREIT ZU SERVIEREN?</span><h2>Dein Menü gehört<br/>ins Jetzt.</h2><p>Kein Abo. Keine Kreditkarte. Keine Ausreden.</p></div><a className="button button-dark button-large" href={loggedIn ? "#/dashboard" : "#/login"}>{loggedIn ? <>Menü verwalten <ArrowRight size={18}/></> : <>Restaurant kostenlos erstellen <ArrowRight size={18}/></>}</a></section>
    <footer className="footer shell"><Logo/><p>Open Source. Für Restaurants gemacht.</p><a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a></footer>
  </main>;
}

function MarketingFooter(){return <footer className="footer shell marketing-footer"><Logo/><p>Open Source. Für Restaurants gemacht.</p><a href="#/">Zur Startseite</a></footer>}

function HowItWorksPage({loggedIn}:{loggedIn:boolean}) {
  return <main className="marketing-page how-page">
    <MarketingNav loggedIn={loggedIn} active="how"/>
    <header className="marketing-page-hero shell"><span className="section-kicker">SO FUNKTIONIERT&apos;S</span><h1>Drei Schritte.<br/><em>Ein fertiges Menü.</em></h1><p>Von der Registrierung bis zum QR-Code auf dem Tisch – ohne technisches Wissen und ohne komplizierte Einrichtung.</p><a className="button button-primary button-large" href={loggedIn?"#/dashboard":"#/login"}>{loggedIn?"Menü verwalten":"Restaurant erstellen"}<ArrowRight size={18}/></a></header>
    <section className="process-journey shell">
      <article><div className="process-number">01</div><div className="process-copy"><span>GRUNDLAGE</span><h2>Restaurant einrichten</h2><p>Trage Name, Standort und Beschreibung ein. Lade dein eigenes Logo und ein Bannerbild hoch und wähle die Akzentfarbe, die zu deinem Restaurant passt.</p><ul><li><Check/> Eigener Restaurantname und Link</li><li><Check/> Logo, Banner und Branding</li><li><Check/> Währung und Standort</li></ul></div><div className="process-visual restaurant-setup-visual"><div className="mini-brand"><span>C</span><div><b>Casa Luma</b><small>Chur, Schweiz</small></div></div><div className="mini-field"><small>RESTAURANTNAME</small><b>Casa Luma</b></div><div className="mini-colors"><i/><i/><i/><i/></div></div></article>
      <article><div className="process-number">02</div><div className="process-copy"><span>INHALT</span><h2>Menü zusammenstellen</h2><p>Erstelle Kategorien für Speisen und Getränke. Ergänze Namen, Beschreibungen, Preise, Eigenschaften und eigene Bilder.</p><ul><li><Check/> Unbegrenzt viele Einträge</li><li><Check/> Bilder und Ernährungsmerkmale</li><li><Check/> Verfügbarkeit mit einem Klick</li></ul></div><div className="process-visual menu-editor-visual"><div><span>Vorspeisen</span><small>2 Einträge</small></div><article><i>🍋</i><p><b>Burrata & Pfirsich</b><small>Basilikumöl · Mandeln</small></p><strong>CHF 18.–</strong></article><article><i>🌿</i><p><b>Luma Hummus</b><small>Za&apos;atar · Fladenbrot</small></p><strong>CHF 14.–</strong></article></div></article>
      <article><div className="process-number">03</div><div className="process-copy"><span>VERÖFFENTLICHUNG</span><h2>Teilen und servieren</h2><p>Schalte deine Karte online, kopiere den öffentlichen Link oder erstelle direkt ein druckfertiges QR-Schild für die Tische.</p><ul><li><Check/> Sofort öffentlich erreichbar</li><li><Check/> QR-Code als PNG und Druckvorlage</li><li><Check/> Änderungen erscheinen direkt</li></ul></div><div className="process-visual publish-visual"><QrCode/><h3>Scannen & geniessen</h3><p>menuva.app/m/casa-luma</p><span><CircleCheck/> Menü veröffentlicht</span></div></article>
    </section>
    <section className="marketing-cta"><div className="shell"><span className="section-kicker light">BEREIT?</span><h2>Deine digitale Karte<br/>kann heute online sein.</h2><a className="button button-primary button-large" href={loggedIn?"#/dashboard":"#/login"}>{loggedIn?"Zum Dashboard":"Kostenlos loslegen"}<ArrowRight size={18}/></a></div></section>
    <MarketingFooter/>
  </main>
}

function FeaturesPage({loggedIn}:{loggedIn:boolean}) {
  const features=[
    {icon:<RefreshCw/>,title:"Sofort aktualisiert",text:"Preise ändern, Gerichte ausblenden oder neue Angebote veröffentlichen – ohne Wartezeit."},
    {icon:<Smartphone/>,title:"Auf jedem Gerät schön",text:"Die Menükarte passt sich automatisch an Smartphones, Tablets und Desktop-Bildschirme an."},
    {icon:<ImagePlus/>,title:"Eigene Bilder",text:"Lade Restaurantlogo, Banner und hochwertige Fotos deiner Speisen direkt hoch."},
    {icon:<Palette/>,title:"Dein eigener Stil",text:"Akzentfarbe, Inhalte und Bilder machen jede Restaurantkarte unverwechselbar."},
    {icon:<QrCode/>,title:"QR-Code inklusive",text:"Generiere QR-Codes, lade sie als PNG herunter oder drucke fertige Tischschilder."},
    {icon:<ShieldCheck/>,title:"Sicher verwaltet",text:"Supabase-Anmeldung und geschützte Benutzerordner sorgen dafür, dass nur du deine Inhalte änderst."},
  ];
  return <main className="marketing-page features-page">
    <MarketingNav loggedIn={loggedIn} active="features"/>
    <header className="marketing-page-hero feature-page-hero shell"><span className="section-kicker">ALLES AN EINEM ORT</span><h1>Weniger verwalten.<br/><em>Mehr bewirten.</em></h1><p>Menuva enthält genau die Werkzeuge, die Restaurants für eine moderne digitale Speisekarte brauchen.</p><div><a className="button button-primary button-large" href={loggedIn?"#/dashboard":"#/login"}>{loggedIn?"Menü verwalten":"Kostenlos starten"}<ArrowRight size={18}/></a><a className="button button-outline button-large" href="#/m/demo">Live-Demo ansehen <ExternalLink size={17}/></a></div></header>
    <section className="feature-page-grid shell">{features.map((feature,index)=><article key={feature.title}><span>{String(index+1).padStart(2,"0")}</span><div>{feature.icon}</div><h2>{feature.title}</h2><p>{feature.text}</p></article>)}</section>
    <section className="feature-highlight"><div className="shell"><div><span className="section-kicker light">FÜR DEN ALLTAG</span><h2>Ein Dashboard.<br/>Alle Änderungen.</h2><p>Vom Tagesgericht bis zum ausverkauften Dessert: Du steuerst deine komplette Karte an einem Ort und deine Gäste sehen sofort den aktuellen Stand.</p><a href="#/how">So funktioniert Menuva <ArrowRight size={17}/></a></div><div className="dashboard-preview-card"><div><span>MENÜVERWALTUNG</span><b>Was gibt&apos;s heute?</b></div><section><i>V</i><p><b>Vorspeisen</b><small>3 Einträge</small></p><em>Online</em></section><section><i>H</i><p><b>Hauptgerichte</b><small>6 Einträge</small></p><em>Online</em></section><section><i>G</i><p><b>Getränke</b><small>8 Einträge</small></p><em>Online</em></section></div></div></section>
    <section className="cta shell feature-bottom-cta"><div><span className="section-kicker">KEIN ABO. KEINE PROVISION.</span><h2>Dein Menü gehört dir.</h2><p>Open Source und kostenlos für Restaurants.</p></div><a className="button button-dark button-large" href={loggedIn?"#/dashboard":"#/login"}>{loggedIn?"Zum Dashboard":"Restaurant erstellen"}<ArrowRight size={18}/></a></section>
    <MarketingFooter/>
  </main>
}

function Auth() {
  const [signup, setSignup] = useState(true); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); setMessage("");
    if (!supabase) return setMessage("Supabase ist noch nicht konfiguriert. Siehe README.md.");
    setBusy(true);
    const result = signup ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) return setMessage(result.error.message);
    if (signup && !result.data.session) setMessage("Bestätige deine E-Mail, danach kannst du dich anmelden.");
    else window.location.hash = "/dashboard";
  }
  return <main className="auth-page"><a className="auth-back" href="#/">← Zurück</a><div className="auth-card"><Logo/><div className="auth-heading"><span className="section-kicker">WILLKOMMEN BEI MENUVA</span><h1>{signup ? "Dein Menü beginnt hier." : "Schön, dich wiederzusehen."}</h1><p>{signup ? "Erstelle kostenlos dein Restaurant und veröffentliche deine Karte." : "Melde dich an, um deine Speisekarte zu verwalten."}</p></div>{!supabaseConfigured && <div className="config-note">Demo-Modus: Hinterlege zuerst deine Supabase-Zugangsdaten.</div>}<form onSubmit={submit}><label>E-Mail<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="hallo@restaurant.ch"/></label><label>Passwort<input type="password" minLength={6} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mindestens 6 Zeichen"/></label>{message && <p className="form-message">{message}</p>}<button className="button button-primary button-full" disabled={busy}>{busy ? <Loader2 className="spin" size={18}/> : null}{signup ? "Kostenlos registrieren" : "Anmelden"}</button></form><p className="auth-switch">{signup ? "Schon registriert?" : "Noch kein Konto?"} <button onClick={()=>{setSignup(!signup);setMessage("")}}>{signup ? "Anmelden" : "Jetzt starten"}</button></p></div><div className="auth-side"><span>“</span><p>Eine gute Speisekarte macht Lust, bevor der erste Teller auf dem Tisch steht.</p><small>MENUVA MANIFEST</small></div></main>;
}

function Dashboard() {
  const [loading, setLoading] = useState(true); const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]); const [items, setItems] = useState<MenuItem[]>([]);
  const [itemModal, setItemModal] = useState(false); const [categoryModal, setCategoryModal] = useState(false); const [qrModal, setQrModal] = useState(false);
  const [dashboardSection, setDashboardSection] = useState<"menu" | "restaurant">("menu");
  const [editing, setEditing] = useState<MenuItem | null>(null); const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.hash = "/login"; return; }
    const { data: rest } = await supabase.from("restaurants").select("*").eq("owner_id", user.id).maybeSingle();
    setRestaurant(rest);
    if (rest) {
      const [{ data: cats }, { data: menu }] = await Promise.all([
        supabase.from("categories").select("*").eq("restaurant_id", rest.id).order("sort_order"),
        supabase.from("menu_items").select("*").eq("restaurant_id", rest.id).order("sort_order"),
      ]); setCategories(cats || []); setItems(menu || []);
    } setLoading(false);
  }, []);
  useEffect(()=>{
    const initialLoad = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(initialLoad);
  },[load]);
  function flash(text: string) { setNotice(text); setTimeout(()=>setNotice(""), 2600); }
  if (loading) return <div className="center-page"><Loader2 className="spin"/><p>Deine Küche wird vorbereitet …</p></div>;
  if (!supabase) return <SetupNeeded />;
  if (!restaurant) return <RestaurantSetup onDone={load}/>;
  async function togglePublished() {
    const next = !restaurant!.published; await supabase!.from("restaurants").update({ published: next }).eq("id", restaurant!.id);
    setRestaurant({ ...restaurant!, published: next }); flash(next ? "Menü ist jetzt öffentlich" : "Menü wurde offline genommen");
  }
  async function toggleAvailable(item: MenuItem) { await supabase!.from("menu_items").update({ available: !item.available }).eq("id",item.id); setItems(items.map(i=>i.id===item.id?{...i,available:!i.available}:i)); }
  async function remove(item: MenuItem) { if (!confirm(`„${item.name}“ wirklich löschen?`)) return; await supabase!.from("menu_items").delete().eq("id",item.id); setItems(items.filter(i=>i.id!==item.id)); flash("Eintrag gelöscht"); }
  async function signOut(){ await supabase!.auth.signOut(); window.location.hash="/"; }
  const menuUrl = `${window.location.origin}${window.location.pathname}#/m/${restaurant.slug}`;
  return <main className="dashboard">
    <aside className="sidebar">
      <Logo inverse/>
      <button className="restaurant-chip" onClick={()=>setDashboardSection("restaurant")}><span>{restaurant.name.slice(0,1)}</span><div><b>{restaurant.name}</b><small>{restaurant.published ? "Online" : "Entwurf"}</small></div><ChevronDown size={15}/></button>
      <nav>
        <button className={dashboardSection==="menu"?"active":""} onClick={()=>setDashboardSection("menu")}><LayoutDashboard size={18}/> Menü</button>
        <a href={`#/m/${restaurant.slug}`}><Eye size={18}/> Vorschau</a>
        <button className={dashboardSection==="restaurant"?"active":""} onClick={()=>setDashboardSection("restaurant")}><Settings size={18}/> Restaurant</button>
      </nav>
      <button className="logout" onClick={signOut}><LogOut size={17}/> Abmelden</button>
    </aside>
    <section className={`dash-main ${dashboardSection==="menu"?"":"hidden-section"}`}>
      <header className="dash-header"><div><span className="dash-overline">MENÜVERWALTUNG</span><h1>Was gibt&apos;s heute?</h1></div><div className="dash-actions"><button className={`status-button ${restaurant.published?"live":""}`} onClick={togglePublished}><span/>{restaurant.published?"Veröffentlicht":"Entwurf"}</button><a className="button button-dark" href={`#/m/${restaurant.slug}`}><Eye size={17}/> Menü ansehen</a></div></header>
      <div className="share-card"><div className="share-icon"><Globe2/></div><div><b>Deine öffentliche Menükarte</b><span>{menuUrl}</span></div><div className="share-actions"><button onClick={()=>{navigator.clipboard.writeText(menuUrl);flash("Link kopiert")}}><Copy size={17}/> Link kopieren</button><button onClick={()=>setQrModal(true)}><QrCode size={17}/> QR-Code drucken</button></div></div>
      <div className="dash-toolbar"><div><h2>Menüeinträge <span>{items.length}</span></h2><p>Organisiere dein Angebot nach Kategorien.</p></div><div><button className="button button-outline" onClick={()=>setCategoryModal(true)}><Plus size={16}/> Kategorie</button><button className="button button-primary" onClick={()=>{setEditing(null);setItemModal(true)}}><Plus size={17}/> Eintrag hinzufügen</button></div></div>
      <div className="menu-board">{categories.length===0?<EmptyState onCategory={()=>setCategoryModal(true)}/>:categories.map(cat=><section className="category-block" key={cat.id}><div className="category-title"><h3>{cat.name}</h3><span>{items.filter(i=>i.category_id===cat.id).length} Einträge</span></div><div className="item-table">{items.filter(i=>i.category_id===cat.id).map(item=><article className={!item.available?"unavailable":""} key={item.id}><div className={`item-thumb ${item.image_url?"has-image":""}`}>{item.image_url?<img src={item.image_url} alt=""/>:item.name.slice(0,1)}</div><div className="item-info"><b>{item.name}</b><span>{item.description || "Keine Beschreibung"}</span><div>{item.vegan&&<small>Vegan</small>}{item.vegetarian&&!item.vegan&&<small>Vegetarisch</small>}{item.spicy&&<small>Scharf</small>}</div></div><strong>{money(item.price,restaurant.currency)}</strong><label className="switch"><input type="checkbox" checked={item.available} onChange={()=>toggleAvailable(item)}/><span/></label><button className="icon-button" onClick={()=>{setEditing(item);setItemModal(true)}} aria-label="Bearbeiten"><Pencil size={16}/></button><button className="icon-button danger" onClick={()=>remove(item)} aria-label="Löschen"><Trash2 size={16}/></button></article>)}{items.filter(i=>i.category_id===cat.id).length===0&&<div className="empty-row">Noch keine Einträge in dieser Kategorie.</div>}</div></section>)}</div>
    </section>
    <section className={`dash-main restaurant-settings-page ${dashboardSection==="restaurant"?"":"hidden-section"}`}>
      <RestaurantSettingsPage restaurant={restaurant} menuUrl={menuUrl} onTogglePublished={togglePublished} onSaved={updated=>{setRestaurant(updated);flash("Restaurant aktualisiert")}}/>
    </section>
    {notice&&<div className="toast"><Check size={17}/>{notice}</div>}
    {qrModal&&<QrCodeModal menuUrl={menuUrl} restaurantName={restaurant.name} onClose={()=>setQrModal(false)}/>}
    {categoryModal&&<CategoryModal restaurant={restaurant} count={categories.length} onClose={()=>setCategoryModal(false)} onSaved={()=>{setCategoryModal(false);load();flash("Kategorie erstellt")}}/>}
    {itemModal&&<ItemModal restaurant={restaurant} categories={categories} item={editing} count={items.length} onClose={()=>setItemModal(false)} onSaved={()=>{setItemModal(false);load();flash(editing?"Eintrag aktualisiert":"Eintrag erstellt")}}/>}
  </main>;
}

function SetupNeeded(){return <div className="center-page setup-needed"><Logo/><h1>Supabase verbinden</h1><p>Kopiere <code>.env.example</code> zu <code>.env.local</code>, trage URL und Anon Key ein und führe <code>supabase/schema.sql</code> im SQL Editor aus.</p><a className="button button-dark" href="#/m/demo">Erst das Demo-Menü ansehen</a></div>}
function QrCodeModal({menuUrl,restaurantName,onClose}:{menuUrl:string;restaurantName:string;onClose:()=>void}) {
  const [qrDataUrl,setQrDataUrl]=useState("");
  useEffect(()=>{
    let active=true;
    void QRCode.toDataURL(menuUrl,{width:900,margin:3,errorCorrectionLevel:"H",color:{dark:"#17201b",light:"#ffffff"}}).then(url=>{if(active)setQrDataUrl(url)});
    return()=>{active=false};
  },[menuUrl]);
  return <div className="qr-modal-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)onClose()}}><div className="qr-modal"><div className="qr-modal-head"><div><span className="section-kicker">DEINE MENÜKARTE</span><h2>QR-Code für {restaurantName}</h2></div><button className="icon-button no-print" onClick={onClose} aria-label="Schliessen"><X/></button></div><div className="qr-print-sheet">{qrDataUrl?<img src={qrDataUrl} alt={`QR-Code für ${restaurantName}`}/>:<div className="qr-loading"><Loader2 className="spin"/><span>QR-Code wird erstellt …</span></div>}<div><h3>{restaurantName}</h3><p>Scannen und digitale Menükarte öffnen</p></div></div><p className="qr-url">{menuUrl}</p><div className="qr-modal-actions no-print"><button className="button button-outline" onClick={onClose}>Schliessen</button>{qrDataUrl&&<a className="button button-outline" href={qrDataUrl} download={`${slugify(restaurantName)||"menuva"}-qr-code.png`}><Download size={17}/> PNG</a>}<button className="button button-primary" disabled={!qrDataUrl} onClick={()=>window.print()}><QrCode size={17}/> Drucken</button></div></div></div>
}
function EmptyState({onCategory}:{onCategory:()=>void}){return <div className="empty-state"><div><Menu size={30}/></div><h3>Deine Karte ist noch leer</h3><p>Erstelle zuerst eine Kategorie wie „Vorspeisen“, „Hauptgerichte“ oder „Getränke“.</p><button className="button button-primary" onClick={onCategory}><Plus size={17}/> Erste Kategorie erstellen</button></div>}

function RestaurantSetup({onDone}:{onDone:()=>void}) {
  const [name,setName]=useState(""); const [location,setLocation]=useState(""); const [description,setDescription]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(e:FormEvent){e.preventDefault();if(!supabase)return;setBusy(true);const {data:{user}}=await supabase.auth.getUser();if(!user)return;const slug=`${slugify(name)}-${Math.random().toString(36).slice(2,6)}`;const {data:r}=await supabase.from("restaurants").insert({owner_id:user.id,name,location,description,slug}).select().single();if(r){const cats=["Vorspeisen","Hauptgerichte","Getränke"].map((n,i)=>({restaurant_id:r.id,name:n,sort_order:i}));await supabase.from("categories").insert(cats);}setBusy(false);onDone();}
  return <main className="onboarding"><div className="onboarding-panel"><Logo/><span className="section-kicker">SCHRITT 1 VON 1</span><h1>Erzähl uns von deinem Restaurant.</h1><p>Diese Angaben erscheinen später oben auf deiner digitalen Karte.</p><form onSubmit={submit}><label>Restaurantname<input required value={name} onChange={e=>setName(e.target.value)} placeholder="z. B. Casa Luma"/></label><label>Standort<input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Chur, Schweiz"/></label><label>Kurzbeschreibung<textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Was macht eure Küche besonders?" rows={3}/></label><button className="button button-primary button-full" disabled={busy}>{busy&&<Loader2 size={17} className="spin"/>}Restaurant erstellen <ArrowRight size={17}/></button></form></div><div className="onboarding-art"><div className="big-plate">🍋<span>🌿</span></div><h2>Deine Karte.<br/><i>Dein Geschmack.</i></h2></div></main>;
}

function RestaurantSettingsPage({restaurant,menuUrl,onTogglePublished,onSaved}:{restaurant:Restaurant;menuUrl:string;onTogglePublished:()=>void;onSaved:(restaurant:Restaurant)=>void}) {
  const [name,setName]=useState(restaurant.name); const [description,setDescription]=useState(restaurant.description||"");
  const [location,setLocation]=useState(restaurant.location||""); const [currency,setCurrency]=useState(restaurant.currency);
  const [slug,setSlug]=useState(restaurant.slug); const [accentColor,setAccentColor]=useState(restaurant.accent_color);
  const [logoFile,setLogoFile]=useState<File|null>(null); const [bannerFile,setBannerFile]=useState<File|null>(null);
  const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  const logoPreview=useImagePreview(logoFile,restaurant.logo_url); const bannerPreview=useImagePreview(bannerFile,restaurant.banner_url);
  async function submit(e:FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try{
      const[logoUrl,bannerUrl]=await Promise.all([logoFile?uploadImage(logoFile,restaurant.owner_id,"restaurant/logo"):restaurant.logo_url,bannerFile?uploadImage(bannerFile,restaurant.owner_id,"restaurant/banner"):restaurant.banner_url]);
      const cleanSlug=slugify(slug);
      const {data,error:updateError}=await supabase!.from("restaurants").update({name:name.trim(),description:description.trim()||null,location:location.trim()||null,currency,slug:cleanSlug,accent_color:accentColor,logo_url:logoUrl,banner_url:bannerUrl}).eq("id",restaurant.id).select().single();
      if(updateError)throw updateError;
      setLogoFile(null);setBannerFile(null);onSaved(data as Restaurant);
    }catch(uploadError){const details=typeof uploadError==="object"&&uploadError?uploadError as {message?:string;code?:string}:{};setError(details.code==="23505"?"Dieser Menü-Link ist bereits vergeben.":details.message||"Upload fehlgeschlagen.")}finally{setBusy(false)}
  }
  const previewUrl=menuUrl.replace(restaurant.slug,slug||restaurant.slug);
  return <div className="settings-page">
    <header className="dash-header settings-page-header">
      <div><span className="dash-overline">RESTAURANTVERWALTUNG</span><h1>Dein Auftritt.</h1><p>Verwalte alle Angaben, die deine Gäste auf der digitalen Karte sehen.</p></div>
      <div className="dash-actions"><button className={`status-button ${restaurant.published?"live":""}`} onClick={onTogglePublished} type="button"><span/>{restaurant.published?"Veröffentlicht":"Entwurf"}</button><a className="button button-dark" href={`#/m/${restaurant.slug}`}><Eye size={17}/> Menü ansehen</a></div>
    </header>
    <form onSubmit={submit} className="settings-form">
      <div className="settings-layout">
        <div className="settings-stack">
          <section className="settings-card">
            <div className="settings-card-head"><span>01</span><div><h2>Stammdaten</h2><p>So wird dein Restaurant auf der Menükarte vorgestellt.</p></div></div>
            <div className="form-grid"><label>Restaurantname<input autoFocus required minLength={2} maxLength={80} value={name} onChange={e=>setName(e.target.value)}/></label><label>Standort<input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Chur, Schweiz"/></label></div>
            <label>Beschreibung<textarea rows={5} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Was macht eure Küche besonders?"/></label>
          </section>
          <section className="settings-card">
            <div className="settings-card-head"><span>02</span><div><h2>Öffentliche Menükarte</h2><p>Lege Adresse und Währung für deine Gäste fest.</p></div></div>
            <div className="form-grid"><label>Öffentlicher Menü-Link<div className="slug-input"><span>/m/</span><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={slug} onChange={e=>setSlug(slugify(e.target.value))}/></div><small className="field-help">Änderungen machen den bisherigen Link ungültig.</small></label><label>Währung<select value={currency} onChange={e=>setCurrency(e.target.value)}><option value="CHF">CHF – Schweizer Franken</option><option value="EUR">EUR – Euro</option><option value="USD">USD – US-Dollar</option><option value="GBP">GBP – Britisches Pfund</option></select></label></div>
          </section>
          <section className="settings-card">
            <div className="settings-card-head"><span>03</span><div><h2>Erscheinungsbild</h2><p>Deine Akzentfarbe prägt Titel, Markierungen und Details.</p></div></div>
            <label className="color-field">Akzentfarbe<div><input type="color" value={accentColor} onChange={e=>setAccentColor(e.target.value)}/><input value={accentColor} pattern="#[0-9a-fA-F]{6}" onChange={e=>setAccentColor(e.target.value)}/></div></label>
            <div className="color-swatches">{["#ff5c35","#147d64","#2764d8","#8d45b5","#c18b24"].map(color=><button key={color} type="button" className={accentColor.toLowerCase()===color?"selected":""} style={{background:color}} onClick={()=>setAccentColor(color)} aria-label={`Farbe ${color}`}/>)}</div>
          </section>
          <section className="settings-card">
            <div className="settings-card-head"><span>04</span><div><h2>Logo & Banner</h2><p>Personalisiere den Kopfbereich deiner öffentlichen Karte.</p></div></div>
            <div className="media-upload-grid">
              <label className="media-upload logo-upload"><span>Restaurantlogo</span><div>{logoPreview?<img src={logoPreview} alt="Logo-Vorschau"/>:<ImagePlus/>}<b><UploadCloud size={16}/> Logo auswählen</b><small>Quadratisch · JPG, PNG oder WebP · max. 5 MB</small></div><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setLogoFile(e.target.files?.[0]||null)}/></label>
              <label className="media-upload banner-upload"><span>Bannerbild</span><div style={bannerPreview?{backgroundImage:`linear-gradient(#17201b22,#17201b22),url(${bannerPreview})`}:undefined}>{!bannerPreview&&<ImagePlus/>}<b><UploadCloud size={16}/> Banner auswählen</b><small>Breites Querformat empfohlen · max. 5 MB</small></div><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setBannerFile(e.target.files?.[0]||null)}/></label>
            </div>
          </section>
        </div>
        <aside className="settings-preview">
          <div className="settings-preview-label"><span>LIVE-VORSCHAU</span><small>Wird beim Tippen aktualisiert</small></div>
          <div className="settings-preview-window" style={{"--preview-accent":accentColor} as React.CSSProperties}>
            <div className="preview-browser"><i/><i/><i/><span>menuva</span></div>
            <div className={`preview-hero ${bannerPreview?"has-banner":""}`} style={bannerPreview?{backgroundImage:`linear-gradient(90deg,#183f34ee,#183f3488),url(${bannerPreview})`}:undefined}>{logoPreview&&<img className="preview-logo" src={logoPreview} alt=""/>}<small>{location||"DEIN STANDORT"}</small><h3>{name||"Dein Restaurant"}</h3><p>{description||"Deine Restaurantbeschreibung erscheint hier."}</p>{!bannerPreview&&<div>{(name||"R").slice(0,1)}</div>}</div>
            <div className="preview-tabs"><b>Alles</b><span>Speisen</span><span>Getränke</span></div>
            <div className="preview-dishes"><article><div><b>Dein erster Menüeintrag</b><small>Beschreibung und Zutaten</small></div><strong>{money(24,currency)}</strong></article><article><div><b>Hausgemachte Spezialität</b><small>Frisch für deine Gäste</small></div><strong>{money(16,currency)}</strong></article></div>
          </div>
          <div className="preview-link"><Globe2 size={16}/><span>{previewUrl}</span></div>
        </aside>
      </div>
      <div className="settings-savebar"><div>{error?<p className="form-message">{error}</p>:<p><CircleCheck size={17}/> Änderungen werden erst nach dem Speichern öffentlich.</p>}</div><button className="button button-primary" disabled={busy}>{busy&&<Loader2 size={17} className="spin"/>}Änderungen speichern</button></div>
    </form>
  </div>
}

function CategoryModal({restaurant,count,onClose,onSaved}:{restaurant:Restaurant;count:number;onClose:()=>void;onSaved:()=>void}){const[name,setName]=useState("");async function submit(e:FormEvent){e.preventDefault();await supabase!.from("categories").insert({restaurant_id:restaurant.id,name,sort_order:count});onSaved()}return <Modal title="Neue Kategorie" onClose={onClose}><form onSubmit={submit}><label>Name<input autoFocus required value={name} onChange={e=>setName(e.target.value)} placeholder="z. B. Desserts"/></label><button className="button button-primary button-full">Kategorie erstellen</button></form></Modal>}
function ItemModal({restaurant,categories,item,count,onClose,onSaved}:{restaurant:Restaurant;categories:Category[];item:MenuItem|null;count:number;onClose:()=>void;onSaved:()=>void}) {
  const[name,setName]=useState(item?.name||"");const[description,setDescription]=useState(item?.description||"");const[price,setPrice]=useState(String(item?.price||""));const[category,setCategory]=useState(item?.category_id||categories[0]?.id||"");
  const[vegetarian,setVegetarian]=useState(item?.vegetarian||false);const[vegan,setVegan]=useState(item?.vegan||false);const[spicy,setSpicy]=useState(item?.spicy||false);const[imageFile,setImageFile]=useState<File|null>(null);const[busy,setBusy]=useState(false);const[error,setError]=useState("");
  const imagePreview=useImagePreview(imageFile,item?.image_url||null);
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError("");try{const imageUrl=imageFile?await uploadImage(imageFile,restaurant.owner_id,"items"):item?.image_url||null;const payload={restaurant_id:restaurant.id,category_id:category,name,description,price:Number(price),vegetarian:vegetarian||vegan,vegan,spicy,image_url:imageUrl,sort_order:item?.sort_order??count};const{error:saveError}=item?await supabase!.from("menu_items").update(payload).eq("id",item.id):await supabase!.from("menu_items").insert(payload);if(saveError)throw saveError;onSaved()}catch(saveError){setError(typeof saveError==="object"&&saveError&&"message" in saveError?String(saveError.message):"Bild oder Eintrag konnte nicht gespeichert werden.")}finally{setBusy(false)}}
  return <Modal title={item?"Eintrag bearbeiten":"Neuer Menüeintrag"} onClose={onClose}><form onSubmit={submit}>
    <label className="dish-image-upload"><span>Bild des Gerichts</span><div className={imagePreview?"has-image":""} style={imagePreview?{backgroundImage:`linear-gradient(#17201b33,#17201b33),url(${imagePreview})`}:undefined}>{!imagePreview&&<ImagePlus/>}<b><UploadCloud size={17}/> {imagePreview?"Bild ersetzen":"Bild auswählen"}</b><small>JPG, PNG oder WebP · maximal 5 MB</small></div><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setImageFile(e.target.files?.[0]||null)}/></label>
    <div className="form-grid"><label>Bezeichnung<input autoFocus required value={name} onChange={e=>setName(e.target.value)} placeholder="Zitronen-Risotto"/></label><label>Kategorie<select required value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label></div>
    <label>Beschreibung<textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Zutaten oder kurze Beschreibung" rows={3}/></label><label>Preis ({restaurant.currency})<input type="number" min="0" step="0.05" required value={price} onChange={e=>setPrice(e.target.value)} placeholder="24.50"/></label>
    <div className="check-row"><label><input type="checkbox" checked={vegetarian} onChange={e=>setVegetarian(e.target.checked)}/>Vegetarisch</label><label><input type="checkbox" checked={vegan} onChange={e=>setVegan(e.target.checked)}/>Vegan</label><label><input type="checkbox" checked={spicy} onChange={e=>setSpicy(e.target.checked)}/>Scharf</label></div>
    {error&&<p className="form-message">{error}</p>}<button className="button button-primary button-full" disabled={busy}>{busy&&<Loader2 size={17} className="spin"/>}{item?"Änderungen speichern":"Eintrag hinzufügen"}</button>
  </form></Modal>
}
function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}){return <div className="modal-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)onClose()}}><div className="modal"><div className="modal-head"><h2>{title}</h2><button className="icon-button" onClick={onClose}><X/></button></div>{children}</div></div>}

function PublicMenu({slug}:{slug:string}) {
  const [restaurant,setRestaurant]=useState<Restaurant|null>(slug==="demo"?demoRestaurant:null);const[categories,setCategories]=useState<Category[]>(slug==="demo"?demoCategories:[]);const[items,setItems]=useState<MenuItem[]>(slug==="demo"?demoItems:[]);const[loading,setLoading]=useState(slug!=="demo");const[query,setQuery]=useState("");const[active,setActive]=useState("all");
  useEffect(()=>{if(slug==="demo")return;(async()=>{if(!supabase){setLoading(false);return}const{data:r}=await supabase.from("restaurants").select("*").eq("slug",slug).eq("published",true).maybeSingle();if(r){setRestaurant(r);const[{data:c},{data:i}]=await Promise.all([supabase.from("categories").select("*").eq("restaurant_id",r.id).order("sort_order"),supabase.from("menu_items").select("*").eq("restaurant_id",r.id).eq("available",true).order("sort_order")]);setCategories(c||[]);setItems(i||[])}setLoading(false)})()},[slug]);
  const visible=useMemo(()=>items.filter(i=>(active==="all"||i.category_id===active)&&(`${i.name} ${i.description}`).toLowerCase().includes(query.toLowerCase())),[items,active,query]);
  if(loading)return <div className="center-page"><Loader2 className="spin"/></div>;if(!restaurant)return <div className="center-page"><Logo/><h1>Menü nicht gefunden</h1><p>Diese Karte ist nicht veröffentlicht oder existiert nicht.</p><a className="button button-dark" href="#/">Zu Menuva</a></div>;
  const heroStyle=restaurant.banner_url?{backgroundImage:`linear-gradient(90deg,#183f34f2,#183f3494),url(${restaurant.banner_url})`}:undefined;
  return <main className="public-menu" style={{"--accent":restaurant.accent_color} as React.CSSProperties}>
    <header className={`menu-hero ${restaurant.banner_url?"has-banner":""}`} style={heroStyle}>
      <nav className="restaurant-menu-nav"><a href="#/" className="powered">Powered by <b>menuva</b></a></nav>
      <div>{restaurant.logo_url&&<img className="restaurant-public-logo" src={restaurant.logo_url} alt={`${restaurant.name} Logo`}/>}<span className="menu-location">{restaurant.location||"Willkommen"}</span><h1>{restaurant.name}</h1><p>{restaurant.description}</p></div>
      {!restaurant.banner_url&&<div className="hero-orb">{restaurant.name.slice(0,1)}</div>}
    </header>
    <div className="menu-sticky"><div className="category-scroll"><button className={active==="all"?"active":""} onClick={()=>setActive("all")}>Alles</button>{categories.map(c=><button className={active===c.id?"active":""} onClick={()=>setActive(c.id)} key={c.id}>{c.name}</button>)}</div><label className="menu-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Gericht suchen"/></label></div>
    <section className="menu-content">{categories.filter(c=>active==="all"||active===c.id).map(category=>{const group=visible.filter(i=>i.category_id===category.id);if(!group.length)return null;return <section key={category.id} className="public-category"><div className="public-category-head"><span>{String(category.sort_order+1).padStart(2,"0")}</span><h2>{category.name}</h2></div><div className="public-items">{group.map(item=><article key={item.id} className={item.image_url?"with-image":""}>{item.image_url&&<img className="public-item-image" src={item.image_url} alt={item.name}/>}<div><div className="public-item-title"><h3>{item.name}</h3><strong>{money(item.price,restaurant.currency)}</strong></div><p>{item.description}</p><div className="diet-tags">{item.vegan&&<span><Leaf size={12}/> Vegan</span>}{item.vegetarian&&!item.vegan&&<span><Leaf size={12}/> Vegetarisch</span>}{item.spicy&&<span>🌶 Scharf</span>}</div></div></article>)}</div></section>})}{visible.length===0&&<div className="no-results"><Search/><h3>Nichts gefunden</h3><p>Versuch es mit einem anderen Suchbegriff.</p></div>}</section>
    <footer className="menu-footer restaurant-menu-footer"><div><b>{restaurant.name}</b><p>{restaurant.location||"Digitale Speisekarte"}</p></div><a href="#/m/" onClick={e=>{e.preventDefault();window.scrollTo({top:0,behavior:"smooth"})}}>Nach oben <ArrowRight size={16}/></a></footer>
  </main>;
}
