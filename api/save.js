// POST /api/save  → บันทึกเนื้อหาเว็บ (ต้องมีรหัสผ่านใน header X-Edit-Password)
import { put } from '@vercel/blob';

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const expected = process.env.EDIT_PASSWORD;
  if (!expected) return res.status(500).json({ error: 'ยังไม่ได้ตั้งค่า EDIT_PASSWORD ใน Vercel' });

  const pw = req.headers['x-edit-password'];
  if (!pw || pw !== expected) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const body = typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(req.body || '{}');
    const content = body.content;
    if (!content || typeof content !== 'object') return res.status(400).json({ error: 'Invalid content' });

    await put('pilar-content.json', JSON.stringify(content), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    });
    return res.status(200).json({ ok: true, savedAt: new Date().toISOString() });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
