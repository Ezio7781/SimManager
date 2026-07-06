import type { VercelRequest, VercelResponse } from '@vercel/node';
import { insertSimCard, listSimCards, updateSimCardStatus } from '../lib/db';
import { SimCard } from '../src/app/models/sim-card.model';

type StatusPayload = {
  id?: string;
  status?: SimCard['status'];
};

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Content-Type', 'application/json');

  if (!process.env.POSTGRES_URL) {
    res.status(500).json({ message: 'Missing Vercel Postgres environment variables.' });
    return;
  }

  try {
    switch (req.method) {
      case 'GET':
        res.status(200).json(await listSimCards());
        return;

      case 'POST': {
        const simCard = getSimCardPayload(req.body);
        res.status(201).json(await insertSimCard(simCard));
        return;
      }

      case 'PATCH': {
        const payload = req.body as StatusPayload | undefined;
        if (!payload?.id || !payload?.status) {
          res.status(400).json({ message: 'SIM id and status are required.' });
          return;
        }

        res.status(200).json(await updateSimCardStatus(payload.id, payload.status));
        return;
      }

      default:
        res.setHeader('Allow', 'GET, POST, PATCH');
        res.status(405).json({ message: 'Method not allowed.' });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    const statusCode = /duplicate key|unique constraint/i.test(message) ? 409 : 500;
    res.status(statusCode).json({ message });
  }
}

function getSimCardPayload(body: unknown): SimCard {
  const payload = body as Partial<SimCard> | undefined;

  if (!payload?.id || !payload.phoneNumber || !payload.personName || !payload.status || !payload.addedDate) {
    throw new Error('Missing required SIM card fields.');
  }

  return {
    id: payload.id,
    phoneNumber: payload.phoneNumber,
    personName: payload.personName,
    status: payload.status,
    addedDate: payload.addedDate
  };
}
