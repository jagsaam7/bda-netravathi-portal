import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import PortalClient from "@/components/PortalClient";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "admin";

  const db = getDb();
  let members = [];
  try {
    const result = await db.execute("SELECT * FROM members ORDER BY block, flat_no");
    members = result.rows;
  } catch {
    // DB not yet initialized — start with empty
  }

  return <PortalClient initialMembers={members} isAdmin={isAdmin} />;
}
