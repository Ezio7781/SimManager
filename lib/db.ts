import { sql } from '@vercel/postgres';
import { SimCard } from '../src/app/models/sim-card.model';

type SimRow = {
  id: string;
  phone_number: string;
  person_name: string;
  status: SimCard['status'];
  added_date: string;
};

let schemaReady: Promise<void> | null = null;

export async function ensureSimTable(): Promise<void> {
  if (!schemaReady) {
    schemaReady = sql`
      CREATE TABLE IF NOT EXISTS sim_cards (
        id TEXT PRIMARY KEY,
        phone_number TEXT NOT NULL,
        person_name TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('Active', 'Deactivated', 'Spam')),
        added_date DATE NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `.then(() => undefined);
  }

  return schemaReady;
}

export async function listSimCards(): Promise<SimCard[]> {
  await ensureSimTable();
  const result = await sql<SimRow>`
    SELECT id, phone_number, person_name, status, added_date
    FROM sim_cards
    ORDER BY created_at DESC, id ASC;
  `;

  return result.rows.map(mapRowToSimCard);
}

export async function insertSimCard(simCard: SimCard): Promise<SimCard[]> {
  await ensureSimTable();
  await sql`
    INSERT INTO sim_cards (id, phone_number, person_name, status, added_date)
    VALUES (${simCard.id}, ${simCard.phoneNumber}, ${simCard.personName}, ${simCard.status}, ${simCard.addedDate});
  `;

  return listSimCards();
}

export async function updateSimCardStatus(id: string, status: SimCard['status']): Promise<SimCard[]> {
  await ensureSimTable();
  await sql`
    UPDATE sim_cards
    SET status = ${status}
    WHERE id = ${id};
  `;

  return listSimCards();
}

function mapRowToSimCard(row: SimRow): SimCard {
  return {
    id: row.id,
    phoneNumber: row.phone_number,
    personName: row.person_name,
    status: row.status,
    addedDate: row.added_date
  };
}
