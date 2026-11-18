import { ClientList } from "./ClientList";

export const metadata = { title: "Clients" };

export default function Clients() {
  return (
    <>
      <h1 className="title">Clients</h1>
      <ClientList />
    </>
  );
}
