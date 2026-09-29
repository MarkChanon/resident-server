// เซิร์ฟเวอร์เล็กๆ สำหรับรันบน Render
// ทำหน้าที่ 2 อย่าง:
// 1. เสิร์ฟหน้าเว็บ (public/index.html)
// 2. เก็บ/โหลดข้อมูลผ่าน Supabase (ฐานข้อมูลออนไลน์ฟรี) แทนไฟล์ในดิสก์
//    -> ข้อมูลจะไม่หายแม้ Render จะ sleep หรือ restart เซิร์ฟเวอร์

const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// ค่า 2 ตัวนี้ต้องตั้งเป็น Environment Variables บน Render
// (Project Settings -> API บน Supabase จะมีให้คัดลอก)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY; // ใช้ "service_role" key (ลับ ห้ามใส่ในหน้าเว็บ)

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('');
  console.error('  ❌ ยังไม่ได้ตั้งค่า SUPABASE_URL หรือ SUPABASE_KEY');
  console.error('  ไปที่ Render -> Environment เพื่อเพิ่มค่าทั้งสองตัวนี้');
  console.error('');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const TABLE = 'kv_store';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ให้ตรงกับ interface ของ window.storage ที่หน้าเว็บเรียกใช้อยู่แล้ว
// get
app.get('/api/storage/:key', async (req, res) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('value')
    .eq('key', req.params.key)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'not found' });
  res.json({ key: req.params.key, value: data.value, shared: true });
});

// set
app.post('/api/storage/:key', async (req, res) => {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ key: req.params.key, value: req.body.value }, { onConflict: 'key' });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ key: req.params.key, value: req.body.value, shared: true });
});

// delete
app.delete('/api/storage/:key', async (req, res) => {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('key', req.params.key);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ key: req.params.key, deleted: true, shared: true });
});

app.listen(PORT, () => {
  console.log('');
  console.log('  ระบบพร้อมใช้งานแล้ว ✅');
  console.log('  พอร์ต: ' + PORT);
  console.log('  ข้อมูลจะถูกเก็บใน Supabase (ตาราง ' + TABLE + ')');
  console.log('');
});
