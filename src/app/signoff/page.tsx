import { SignoffList } from "@/components/SignoffList";

export default function SignoffQueue() {
  return (
    <>
      <div className="pagehead">
        <div>
          <div className="eyebrow">Nothing ships without your eyes</div>
          <h1 className="title">Sign-off</h1>
        </div>
      </div>
      <SignoffList />
    </>
  );
}
