"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { serverTimestamp } from "firebase/firestore";
import { logout } from "@/lib/auth/auth-service";
import { auth } from "@/lib/firebase";
import type { DeliveryAgency, Dish, IndependentCourier, InternalCourier, OpeningHours, Order, OrderStatus, Restaurant } from "@/lib/firestore/models";
import {
  createDish,
  deleteDish,
  markOrderPickedUpByQr,
  saveRestaurant,
  subscribeDishes,
  subscribeOrders,
  subscribeRestaurant,
  updateDish,
  updateOrderStatus,
  assignExternalDelivery,
  assignInternalDelivery,
  createInternalCourier,
  deactivateInternalCourier,
  subscribeExternalPartners,
  subscribeInternalCouriers,
} from "@/lib/restaurant/restaurant-service";
import { RoleGuard } from "./role-guard";
import { useAuth } from "./auth-provider";
import { RestaurantPosts } from "./restaurant-posts";
import styles from "./restaurant-dashboard.module.css";

const DEFAULT_HOURS: OpeningHours = {
  monday: "08:00 - 22:00", tuesday: "08:00 - 22:00",
  wednesday: "08:00 - 22:00", thursday: "08:00 - 22:00",
  friday: "08:00 - 23:00", saturday: "08:00 - 23:00", sunday: "Fermé",
};
const TODAY = new Date().toISOString().slice(0, 10);
const CURRENT_STATUSES: OrderStatus[] = ["paid", "accepted", "preparing", "ready"];
const VALIDATED_STATUSES: OrderStatus[] = ["picked_up", "completed"];
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Paiement en attente", paid: "Payée", accepted: "Acceptée",
  preparing: "En préparation", ready: "Prête", in_delivery: "En livraison",
  picked_up: "Retirée", completed: "Livrée", cancelled: "Annulée",
};
const DeliveryMap = dynamic(() => import("./delivery-map").then((module) => module.DeliveryMap), { ssr: false });

export function RestaurantDashboard() {
  return (
    <RoleGuard role="restaurant">
      <RestaurantWorkspace />
    </RoleGuard>
  );
}

function RestaurantWorkspace() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [activeView, setActiveView] = useState<"orders" | "menu" | "shop" | "scanner" | "delivery" | "posts">("orders");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubscribeRestaurant = subscribeRestaurant(user.uid, setRestaurant);
    const unsubscribeDishes = subscribeDishes(user.uid, setDishes);
    const unsubscribeOrders = subscribeOrders(user.uid, setOrders);
    return () => {
      unsubscribeRestaurant();
      unsubscribeDishes();
      unsubscribeOrders();
    };
  }, [user]);

  if (!user) return null;

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <div><strong className={styles.logo}>MiamGo</strong><small>Espace restaurant</small></div>
        <nav>
          <NavButton active={activeView === "orders"} onClick={() => setActiveView("orders")} label="Commandes" count={orders.filter((order) => CURRENT_STATUSES.includes(order.status)).length} />
          <NavButton active={activeView === "menu"} onClick={() => setActiveView("menu")} label="Menu & plats" count={dishes.length} />
          <NavButton active={activeView === "shop"} onClick={() => setActiveView("shop")} label="Ma boutique" />
          <NavButton active={activeView === "scanner"} onClick={() => setActiveView("scanner")} label="Scanner un retrait" />
          <NavButton active={activeView === "delivery"} onClick={() => setActiveView("delivery")} label="Livraisons" />
          <NavButton active={activeView === "posts"} onClick={() => setActiveView("posts")} label="Publications" />
        </nav>
        <div className={styles.account}>
          <span>{restaurant?.name ?? profile?.displayName}</span>
          <button onClick={async () => { await logout(); router.replace("/connexion"); }}>Déconnexion</button>
        </div>
      </aside>

      <section className={styles.content}>
        {activeView === "orders" && <OrdersView orders={orders} />}
        {activeView === "menu" && <MenuView restaurantId={user.uid} restaurant={restaurant} dishes={dishes} />}
        {activeView === "shop" && <ShopView key={restaurant?.updatedAt?.toMillis?.() ?? "new"} restaurantId={user.uid} profileName={profile?.displayName ?? ""} restaurant={restaurant} />}
        {activeView === "scanner" && <ScannerView restaurantId={user.uid} />}
        {activeView === "delivery" && <DeliveryView restaurantId={user.uid} restaurant={restaurant} orders={orders} />}
        {activeView === "posts" && <RestaurantPosts restaurantId={user.uid} />}
      </section>
    </main>
  );
}

function DeliveryView({ restaurantId, restaurant, orders }: { restaurantId: string; restaurant: Restaurant | null; orders: Order[] }) {
  const [couriers, setCouriers] = useState<InternalCourier[]>([]);
  const [partners, setPartners] = useState<Array<IndependentCourier | DeliveryAgency>>([]);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"internal" | "external" | "none">((restaurant?.deliveryModes.includes("internal") ? "internal" : restaurant?.deliveryModes.includes("external") ? "external" : "none"));

  useEffect(() => {
    const stopCouriers = subscribeInternalCouriers(restaurantId, setCouriers);
    const stopPartners = subscribeExternalPartners(setPartners);
    return () => { stopCouriers(); stopPartners(); };
  }, [restaurantId]);

  async function saveMode(value: "internal" | "external" | "none") {
    setMode(value);
    await saveRestaurant(restaurantId, {
      deliveryModes: value === "none" ? ["pickup"] : ["pickup", value],
      deliveryPricing: restaurant?.deliveryPricing ?? { basePrice: 500, pricePerKm: 250 },
    });
  }

  async function addCourier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await createInternalCourier(restaurantId, { firstName: String(data.get("firstName")), lastName: String(data.get("lastName")), phone: String(data.get("phone")), gender: String(data.get("gender")) as InternalCourier["gender"] });
      event.currentTarget.reset(); setMessage("Livreur ajouté et rattaché à ce restaurant.");
    } catch (error) { setMessage(errorMessage(error)); }
  }

  const deliveryOrders = orders.filter((order) => order.fulfillmentMode !== "pickup" && ["ready", "accepted", "in_delivery"].includes(order.status));
  return <div className={styles.view}>
    <Header eyebrow="F-REST-11 à F-REST-18" title="Livraisons" subtitle="Aucune commission MiamGo : le client paie le tarif affiché selon la distance." />
    <div className={styles.deliveryModes}>
      {([ ["none", "Aucune livraison"], ["internal", "Livreurs internes"], ["external", "Réseau externe"] ] as const).map(([value, label]) => <button key={value} onClick={() => saveMode(value)} className={mode === value ? styles.deliveryActive : ""}>{label}</button>)}
    </div>
    <section className={styles.deliveryPricing}><h2>Tarification automatique</h2><p>Base : {money(restaurant?.deliveryPricing?.basePrice ?? 500)} · {money(restaurant?.deliveryPricing?.pricePerKm ?? 250)}/km. La géolocalisation client est enregistrée à la commande, puis le prix est affiché avant paiement.</p></section>
    {mode === "internal" && <section className={styles.deliveryPanel}><h2>Livreurs internes</h2><form onSubmit={addCourier} className={styles.courierForm}><input name="firstName" placeholder="Prénom" required /><input name="lastName" placeholder="Nom" required /><input name="phone" type="tel" placeholder="Téléphone" required /><select name="gender" defaultValue="male"><option value="female">Femme</option><option value="male">Homme</option><option value="other">Autre</option></select><button className={styles.primaryButton}>Ajouter le livreur</button></form><p className={styles.helper}>Le lien d&apos;inscription livreur rattache son compte au restaurant à l&apos;activation. La désactivation coupe immédiatement son accès opérationnel.</p><CourierList couriers={couriers} onDeactivate={async (courier) => { await deactivateInternalCourier(courier.id); setMessage(`${courier.firstName} désactivé.`); }} /></section>}
    {mode === "external" && <section className={styles.deliveryPanel}><h2>Livreurs indépendants & agences disponibles</h2><div className={styles.partnerGrid}>{partners.map((partner) => <PartnerCard key={partner.id} partner={partner} />)}{!partners.length && <Empty text="Aucun partenaire disponible actuellement." />}</div></section>}
    {message && <p className={styles.message}>{message}</p>}
    <section className={styles.deliveryPanel}><h2>Courses à affecter et suivi</h2><div className={styles.orderList}>{deliveryOrders.map((order) => <DeliveryOrderCard key={order.id} order={order} mode={mode} couriers={couriers} partners={partners} />)}{!deliveryOrders.length && <Empty text="Aucune course de livraison active." />}</div></section>
  </div>;
}

function CourierList({ couriers, onDeactivate }: { couriers: InternalCourier[]; onDeactivate: (courier: InternalCourier) => void }) {
  return <div className={styles.courierList}>{couriers.map((courier) => <article key={courier.id}><div><strong>{courier.firstName} {courier.lastName}</strong><span>{courier.phone}</span></div><span className={courier.active && courier.status === "available" ? styles.good : styles.muted}>{courier.active ? (courier.status === "available" ? "Libre" : "En course") : "Désactivé"}</span><small>{courier.deliveryCount} commande(s)</small>{courier.active && <button onClick={() => onDeactivate(courier)}>Désactiver</button>}</article>)}</div>;
}

function PartnerCard({ partner }: { partner: IndependentCourier | DeliveryAgency }) {
  const phone = "whatsappPhone" in partner ? partner.whatsappPhone ?? partner.phone : partner.phone;
  const label = "ownerId" in partner ? "Agence partenaire" : "Livreur indépendant";
  return <article className={styles.partnerCard}><small>{label}</small><h3>{"name" in partner ? partner.name : `${partner.firstName} ${partner.lastName}`}</h3><p>{partner.phone}</p>{phone && <a href={`https://wa.me/${phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">Contacter sur WhatsApp</a>}</article>;
}

function DeliveryOrderCard({ order, mode, couriers, partners }: { order: Order; mode: "internal" | "external" | "none"; couriers: InternalCourier[]; partners: Array<IndependentCourier | DeliveryAgency> }) {
  const [selected, setSelected] = useState("");
  const candidates = mode === "internal" ? couriers.filter((courier) => courier.active && courier.status === "available") : partners;
  const needsAssign = order.status === "ready";
  const thirdParty = order.deliveryThirdParty;
  return <article className={styles.deliveryOrder}><div><small>{order.serialNumber}</small><h3>{order.clientName}</h3><p>{thirdParty ? `Tiers : ${order.recipient?.name} · ${order.recipient?.phone}` : `Client : ${order.clientPhone}`}</p><p>{order.deliveryDistanceKm?.toFixed(1) ?? "-"} km · livraison {money(order.deliveryPrice)}</p></div>{order.courierLocation && <DeliveryMap courier={order.courierLocation} destination={order.deliveryDestination} />}{needsAssign && mode !== "none" && <div className={styles.assignment}><select value={selected} onChange={(event) => setSelected(event.target.value)}><option value="">Sélectionner un livreur</option>{candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{"name" in candidate ? candidate.name : `${candidate.firstName} ${candidate.lastName}`}</option>)}</select><button disabled={!selected} onClick={async () => { const candidate = candidates.find((item) => item.id === selected); if (!candidate) return; if (mode === "internal") await assignInternalDelivery(order.id, candidate as InternalCourier); else await assignExternalDelivery(order.id, candidate as IndependentCourier | DeliveryAgency); }}>Envoyer la course</button></div>}{order.status === "accepted" && <span className={styles.status}>En attente de l&apos;acceptation externe</span>}{order.status === "in_delivery" && <span className={styles.good}>Course acceptée · suivi actif</span>}</article>;
}

function NavButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count?: number }) {
  return <button className={active ? styles.activeNav : ""} onClick={onClick}><span>{label}</span>{count !== undefined && <b>{count}</b>}</button>;
}

function ShopView({ restaurantId, profileName, restaurant }: { restaurantId: string; profileName: string; restaurant: Restaurant | null }) {
  const [name, setName] = useState(restaurant?.name ?? profileName);
  const [description, setDescription] = useState(restaurant?.description ?? "");
  const [address, setAddress] = useState(restaurant?.address ?? "");
  const [phone, setPhone] = useState(restaurant?.phone ?? "");
  const [contactEmail, setContactEmail] = useState(restaurant?.contactEmail ?? "");
  const [openingHours, setOpeningHours] = useState(restaurant?.openingHours ?? DEFAULT_HOURS);
  const [logoUrl] = useState(restaurant?.logoUrl ?? "");
  const [coverUrl] = useState(restaurant?.coverUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setMessage("");
    try {
      const data = new FormData(event.currentTarget);
      const logo = data.get("logo");
      const cover = data.get("cover");
      const [newLogo, newCover] = await Promise.all([
        logo instanceof File && logo.size ? uploadImage(logo) : logoUrl,
        cover instanceof File && cover.size ? uploadImage(cover) : coverUrl,
      ]);
      await saveRestaurant(restaurantId, {
        name, slug: toSlug(name), description, address, phone, contactEmail,
        openingHours, logoUrl: newLogo, coverUrl: newCover,
        menuCategoryIds: restaurant?.menuCategoryIds ?? [],
        dailySpecialDishIds: restaurant?.dailySpecialDishIds ?? [],
        dailySpecialMode: restaurant?.dailySpecialMode ?? false,
        subscriptionPlan: restaurant?.subscriptionPlan ?? "starter",
        deliveryModes: restaurant?.deliveryModes ?? ["pickup"],
        isActive: true,
        createdAt: restaurant?.createdAt ?? (serverTimestamp() as never),
      });
      setMessage("Boutique enregistrée.");
    } catch (error) { setMessage(errorMessage(error)); }
    finally { setSaving(false); }
  }

  return (
    <div className={styles.view}>
      <Header eyebrow="F-REST-01 · F-REST-02" title="Votre boutique" subtitle="Identité, contact et horaires publics." />
      <form className={styles.editor} onSubmit={submit}>
        <div className={styles.twoColumns}>
          <Field label="Nom de la boutique"><input value={name} onChange={(e) => setName(e.target.value)} required /></Field>
          <Field label="Téléphone"><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required /></Field>
          <Field label="E-mail de contact"><input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required /></Field>
          <Field label="Adresse"><input value={address} onChange={(e) => setAddress(e.target.value)} required /></Field>
        </div>
        <Field label="Description"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} /></Field>
        <div className={styles.twoColumns}>
          <Field label="Logo (ImgBB)"><input name="logo" type="file" accept="image/*" /></Field>
          <Field label="Image de couverture (ImgBB)"><input name="cover" type="file" accept="image/*" /></Field>
        </div>
        <div className={styles.hours}><h3>Horaires</h3>{Object.entries(openingHours).map(([day, value]) => <Field key={day} label={dayLabel(day)}><input value={value} onChange={(e) => setOpeningHours((current) => ({ ...current, [day]: e.target.value }))} /></Field>)}</div>
        {message && <p className={styles.message}>{message}</p>}
        <button className={styles.primaryButton} disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer la boutique"}</button>
      </form>
    </div>
  );
}

function MenuView({ restaurantId, restaurant, dishes }: { restaurantId: string; restaurant: Restaurant | null; dishes: Dish[] }) {
  const [editing, setEditing] = useState<Dish | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");

  async function toggleDaily(dish: Dish) {
    const selected = !(dish.isDailySpecial && dish.dailySpecialDate === TODAY);
    const ids = new Set(restaurant?.dailySpecialDishIds ?? []);
    if (selected) ids.add(dish.id);
    else ids.delete(dish.id);
    await Promise.all([
      updateDish(dish.id, { isDailySpecial: selected, dailySpecialDate: selected ? TODAY : "" }),
      saveRestaurant(restaurantId, { dailySpecialDishIds: [...ids], dailySpecialMode: true }),
    ]);
  }

  return (
    <div className={styles.view}>
      <Header eyebrow="F-REST-03 à F-REST-06" title="Menu & plats" subtitle="Le menu reste visible; en mode plat du jour, seuls les plats sélectionnés sont commandables." />
      <div className={styles.toolbar}>
        <label className={styles.switch}><input type="checkbox" checked={restaurant?.dailySpecialMode ?? false} onChange={(e) => saveRestaurant(restaurantId, { dailySpecialMode: e.target.checked })} /> Mode plat du jour</label>
        <button className={styles.primaryButton} onClick={() => { setEditing(null); setShowForm(true); }}>Ajouter un plat</button>
      </div>
      {message && <p className={styles.message}>{message}</p>}
      {showForm && <DishEditor restaurantId={restaurantId} dish={editing} onClose={() => setShowForm(false)} onMessage={setMessage} />}
      <div className={styles.dishGrid}>
        {dishes.map((dish) => {
          const promo = dish.promotionDate === TODAY && dish.promotionPrice;
          const daily = dish.isDailySpecial && dish.dailySpecialDate === TODAY;
          const orderable = dish.available && (!restaurant?.dailySpecialMode || daily);
          return (
            <article className={styles.dishCard} key={dish.id}>
              <div className={styles.dishImage} style={{ backgroundImage: `url("${dish.photoUrl}")` }}><span>{dish.category}</span></div>
              <div className={styles.dishBody}>
                <div><h3>{dish.name}</h3><p>{dish.description}</p></div>
                <p className={styles.price}>{promo && <del>{money(dish.price)}</del>} {money(Number(promo || dish.price))}</p>
                <div className={styles.badges}><span className={orderable ? styles.good : styles.muted}>{orderable ? "Commandable" : "Non commandable"}</span>{daily && <span>Plat du jour</span>}</div>
                <div className={styles.cardActions}>
                  <button onClick={() => updateDish(dish.id, { available: !dish.available })}>{dish.available ? "Mettre en rupture" : "Rendre disponible"}</button>
                  <button onClick={() => toggleDaily(dish)}>{daily ? "Retirer du jour" : "Plat du jour"}</button>
                  <button onClick={() => { setEditing(dish); setShowForm(true); }}>Modifier</button>
                  <button className={styles.danger} onClick={async () => { if (confirm(`Supprimer ${dish.name} ?`)) await deleteDish(dish.id); }}>Supprimer</button>
                </div>
              </div>
            </article>
          );
        })}
        {!dishes.length && <Empty text="Aucun plat. Ajoutez le premier élément de votre menu." />}
      </div>
    </div>
  );
}

function DishEditor({ restaurantId, dish, onClose, onMessage }: { restaurantId: string; dish: Dish | null; onClose: () => void; onMessage: (value: string) => void }) {
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true);
    try {
      const data = new FormData(event.currentTarget);
      const file = data.get("photo");
      const photoUrl = file instanceof File && file.size ? await uploadImage(file) : dish?.photoUrl;
      if (!photoUrl) throw new Error("La photo du plat est obligatoire.");
      const promotionPrice = Number(data.get("promotionPrice")) || undefined;
      const values = {
        name: String(data.get("name")), description: String(data.get("description")),
        photoUrl, price: Number(data.get("price")), category: String(data.get("category")),
        promotionPrice, promotionDate: promotionPrice ? TODAY : "",
        available: dish?.available ?? true, isDailySpecial: dish?.isDailySpecial ?? false,
        dailySpecialDate: dish?.dailySpecialDate ?? "",
      };
      if (dish) await updateDish(dish.id, values); else await createDish(restaurantId, values);
      onMessage(dish ? "Plat modifié." : "Plat ajouté."); onClose();
    } catch (error) { onMessage(errorMessage(error)); }
    finally { setSaving(false); }
  }
  return (
    <form className={styles.dishEditor} onSubmit={submit}>
      <div className={styles.formTitle}><h2>{dish ? "Modifier le plat" : "Nouveau plat"}</h2><button type="button" onClick={onClose}>Fermer</button></div>
      <div className={styles.twoColumns}>
        <Field label="Nom"><input name="name" defaultValue={dish?.name} required /></Field>
        <Field label="Catégorie"><input name="category" defaultValue={dish?.category} required /></Field>
        <Field label="Prix normal (FCFA)"><input name="price" type="number" min="0" defaultValue={dish?.price} required /></Field>
        <Field label="Prix promotionnel du jour"><input name="promotionPrice" type="number" min="0" defaultValue={dish?.promotionDate === TODAY ? dish.promotionPrice : ""} /></Field>
      </div>
      <Field label="Description"><textarea name="description" defaultValue={dish?.description} rows={3} required /></Field>
      <Field label="Photo via ImgBB"><input name="photo" type="file" accept="image/*" required={!dish} /></Field>
      <button className={styles.primaryButton} disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer le plat"}</button>
    </form>
  );
}

function OrdersView({ orders }: { orders: Order[] }) {
  const current = orders.filter((order) => CURRENT_STATUSES.includes(order.status));
  const validated = orders.filter((order) => VALIDATED_STATUSES.includes(order.status));
  const history = orders.filter((order) => ["picked_up", "completed", "cancelled"].includes(order.status));
  return <div className={styles.view}><Header eyebrow="F-REST-07 à F-REST-09 · Temps réel" title="Commandes" subtitle="Chaque changement Firestore est affiché instantanément." /><OrderSection title="Commandes en cours" orders={current} actions /><OrderSection title="Commandes validées" orders={validated} /><OrderSection title="Historique" orders={history} detailed /></div>;
}

function OrderSection({ title, orders, actions, detailed }: { title: string; orders: Order[]; actions?: boolean; detailed?: boolean }) {
  return <section className={styles.orderSection}><div className={styles.sectionTitle}><h2>{title}</h2><span>{orders.length}</span></div><div className={styles.orderList}>{orders.map((order) => <OrderCard key={order.id} order={order} actions={actions} detailed={detailed} />)}{!orders.length && <Empty text="Aucune commande dans cette section." />}</div></section>;
}

function OrderCard({ order, actions, detailed }: { order: Order; actions?: boolean; detailed?: boolean }) {
  const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = { paid: "accepted", accepted: "preparing", preparing: "ready" };
  return <article className={styles.orderCard}><div className={styles.orderTop}><div><small>{formatTime(order)}</small><h3>{order.serialNumber}</h3></div><span className={styles.status}>{STATUS_LABELS[order.status]}</span></div><div className={styles.customer}><strong>{order.clientName || order.recipient?.name || "Client"}</strong><span>{order.clientPhone || order.recipient?.phone}</span></div><ul>{order.items.map((item) => <li key={`${order.id}-${item.dishId}`}><span>{item.quantity} × {item.name}</span><b>{money(item.unitPrice * item.quantity)}</b></li>)}</ul><div className={styles.orderTotal}><span>{order.fulfillmentMode === "pickup" ? "Retrait sur place" : "Livraison"}</span><strong>{money(order.total)}</strong></div>{detailed && <p className={styles.detailLine}>Créée à {formatTime(order)} · {STATUS_LABELS[order.status]}</p>}{actions && nextStatus[order.status] && <button className={styles.primaryButton} onClick={() => updateOrderStatus(order.id, nextStatus[order.status] as OrderStatus)}>{nextAction(order.status)}</button>}</article>;
}

function ScannerView({ restaurantId }: { restaurantId: string }) {
  const [value, setValue] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState("");
  useEffect(() => {
    if (!scanning) return;
    let scanner: import("html5-qrcode").Html5QrcodeScanner | null = null;
    void import("html5-qrcode").then(({ Html5QrcodeScanner }) => {
      scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: { width: 240, height: 240 } }, false);
      scanner.render((decodedText) => { setValue(decodedText); setScanning(false); void runPickupValidation(restaurantId, decodedText, setResult); }, () => undefined);
    });
    return () => { if (scanner) void scanner.clear().catch(() => undefined); };
  }, [restaurantId, scanning]);

  async function validate(qr = value) {
    await runPickupValidation(restaurantId, qr, setResult);
  }
  return <div className={styles.view}><Header eyebrow="F-REST-10" title="Scanner un retrait" subtitle="Scannez le QR du client. La commande doit être prête et appartenir à votre restaurant." /><div className={styles.scannerCard}><button className={styles.primaryButton} onClick={() => setScanning((current) => !current)}>{scanning ? "Arrêter la caméra" : "Ouvrir la caméra"}</button>{scanning && <div id="qr-reader" className={styles.qrReader} />}<p>Ou collez la valeur du QR :</p><input value={value} onChange={(e) => setValue(e.target.value)} placeholder="miamgo:commande:code" /><button onClick={() => validate()} disabled={!value}>Valider le retrait</button>{result && <strong className={styles.scanResult}>{result}</strong>}</div></div>;
}

function Header({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) { return <header className={styles.header}><p>{eyebrow}</p><h1>{title}</h1><span>{subtitle}</span></header>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className={styles.field}><span>{label}</span>{children}</label>; }
function Empty({ text }: { text: string }) { return <div className={styles.empty}>{text}</div>; }
function money(value: number) { return `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`; }
function formatTime(order: Order) { return order.createdAt?.toDate?.().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) ?? "À l'instant"; }
function errorMessage(error: unknown) { return error instanceof Error ? error.message : "Une erreur est survenue."; }
function nextAction(status: OrderStatus) { return status === "paid" ? "Accepter" : status === "accepted" ? "Lancer la préparation" : "Marquer prête"; }
function dayLabel(day: string) { return ({ monday: "Lundi", tuesday: "Mardi", wednesday: "Mercredi", thursday: "Jeudi", friday: "Vendredi", saturday: "Samedi", sunday: "Dimanche" } as Record<string, string>)[day] ?? day; }
function toSlug(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
async function uploadImage(file: File): Promise<string> { const token = await auth?.currentUser?.getIdToken(); if (!token) throw new Error("Session Firebase expirée."); const data = new FormData(); data.append("file", file); const response = await fetch("/api/images", { method: "POST", headers: { authorization: `Bearer ${token}` }, body: data }); const result = await response.json() as { url?: string; error?: string }; if (!response.ok || !result.url) throw new Error(result.error ?? "Upload impossible."); return result.url; }
async function runPickupValidation(restaurantId: string, qr: string, setResult: (value: string) => void) { setResult("Validation..."); try { const order = await markOrderPickedUpByQr(restaurantId, qr); setResult(`Commande ${order.serialNumber} retirée.`); } catch (error) { setResult(errorMessage(error)); } }
