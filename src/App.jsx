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

const events = [
  { id: 1, title: "Lagos Tech Fest", date: "14 Nov 2026", venue: "Landmark Centre, Lagos", price: 0 },
  { id: 2, title: "Afrobeats live", date: "21 Nov 2026", venue: "Eko hotel, Lagos", price: 15000 },
  { id: 3, title: "Founders breakfast", date: "2 Dec 2026", venue: "Ikoyi, Lagos", price: 5000 },
    { id: 4, title: "Your Event Name", date: "...", venue: "...", price: 2500 },
];
export default function App() {
  
  return (
    <main>
      <h1>Gatepass</h1>
      {events.map(event => <EventCard 
      key = {event.id}
      title={event.title} 
      venue = {event.venue}
      price = {event.price}
      date = {event.date}/>)}
      
      
    </main>
  );
}