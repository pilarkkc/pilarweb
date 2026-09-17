// POST /api/upload → รับรูป (dataURL) เก็บขึ้น Blob แล้วคืนลิงก์รูปกลับไป
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
    const m = /^data:([\w/+.-]+);base64,(.+)$/.exec(body.dataUrl || '');
    if (!m) return res.status(400).json({ error: 'Invalid image data' });

    const mime = m[1];
    if (!mime.startsWith('image/')) return res.status(400).json({ error: 'Not an image' });

    const buf = Buffer.from(m[2], 'base64');
    const ext = (mime.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    const safe = String(body.name || 'photo').replace(/\.[^.]+$/, '').replace(/[^\w-]/g, '').slice(0, 40) || 'photo';

    const blob = await put(`img/${Date.now()}-${safe}.${ext}`, buf, {
      access: 'public',
      contentType: mime,
    });
    return res.status(200).json({ url: blob.url });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
