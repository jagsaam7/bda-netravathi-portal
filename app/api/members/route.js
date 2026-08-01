import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const db = getDb();
  const result = await db.execute(
    "SELECT * FROM members ORDER BY block, flat_no, role"
  );
  return NextResponse.json(result.rows);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { block, flat_no, role, name, mobile, dob, address, photo_url } = body;

  if (!["owner", "tenant"].includes(role))
    return NextResponse.json({ error: "role must be owner or tenant" }, { status: 400 });

  const db = getDb();
  await db.execute({
    sql: `INSERT INTO members (block, flat_no, role, name, mobile, dob, address, photo_url)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(block, flat_no, role) DO UPDATE SET
            name=excluded.name, mobile=excluded.mobile, dob=excluded.dob,
            address=excluded.address, photo_url=excluded.photo_url,
            updated_at=datetime('now')`,
    args: [block, flat_no, role, name, mobile||null, dob||null, address||null, photo_url||null],
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { block, flat_no, role } = await req.json();
  const db = getDb();
  if (role) {
    // Delete specific role (owner or tenant)
    await db.execute({
      sql: "DELETE FROM members WHERE block=? AND flat_no=? AND role=?",
      args: [block, flat_no, role],
    });
  } else {
    // Delete all members in flat
    await db.execute({
      sql: "DELETE FROM members WHERE block=? AND flat_no=?",
      args: [block, flat_no],
    });
  }
  return NextResponse.json({ success: true });
}
