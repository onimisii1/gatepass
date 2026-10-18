function EventCard(props) {
  return (
    <div>
      <h2>{props.title}</h2>
      <p>{props.venue}</p>
      <p>{props.price === 0 ? "Free" : "₦" + props.price.toLocaleString()}</p>
      <p>{props.date}</p>
    </div>
  );
}

export default function App() {
  return (
    <main>
      <h1>Gatepass</h1>
      <EventCard title="Lagos Tech Fest" venue="Landmark Centre, Lagos" price = {0} date = "14 Nov 2026"/>
      <EventCard title="Afrobeats live" venue="Eko hotel, Lagos" price = {15000} date = "21 Nov 2026" />
      <EventCard title="Founders breakfast" venue="Ikoyi, Lagos" price = {5000} date = "2 Dec 2026"/>
    </main>
  );
}