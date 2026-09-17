// GET /api/content  → ส่งเนื้อหาเว็บล่าสุดที่บันทึกไว้ (ถ้ายังไม่เคยบันทึก จะได้ content: null)
import { list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  try {
    const { blobs } = await list({ prefix: 'pilar-content', limit: 20 });
    if (!blobs || blobs.length === 0) return res.status(200).json({ content: null });
    blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    const r = await fetch(blobs[0].url + '?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) return res.status(200).json({ content: null });
    const content = await r.json();
    return res.status(200).json({ content, savedAt: blobs[0].uploadedAt });
  } catch (e) {
    // API มีอยู่ แต่ยังอ่านที่เก็บไม่ได้ → ให้เว็บใช้เนื้อหาที่ฝังในไฟล์ไปก่อน
    return res.status(200).json({ content: null, error: String((e && e.message) || e) });
  }
}
