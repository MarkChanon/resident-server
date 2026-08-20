// เซิร์ฟเวอร์เล็กๆ สำหรับรันบนเครื่องตัวเอง
// ทำหน้าที่ 2 อย่าง:
// 1. เสิร์ฟหน้าเว็บ (public/index.html)
// 2. เก็บ/โหลดข้อมูลลงไฟล์ data/store.json บนดิสก์จริง (ไม่ใช่แค่ localStorage)

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'store.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readStore() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}

function writeStore(store) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
}

// ให้ตรงกับ interface ของ window.storage ที่หน้าเว็บเรียกใช้อยู่แล้ว
// get
app.get('/api/storage/:key', (req, res) => {
  const store = readStore();
  const entry = store[req.params.key];
  if (entry === undefined) return res.status(404).json({ error: 'not found' });
  res.json({ key: req.params.key, value: entry, shared: true });
});

// set
app.post('/api/storage/:key', (req, res) => {
  const store = readStore();
  store[req.params.key] = req.body.value;
  writeStore(store);
  res.json({ key: req.params.key, value: req.body.value, shared: true });
});

// delete
app.delete('/api/storage/:key', (req, res) => {
  const store = readStore();
  delete store[req.params.key];
  writeStore(store);
  res.json({ key: req.params.key, deleted: true, shared: true });
});

app.listen(PORT, () => {
  console.log('');
  console.log('  ระบบพร้อมใช้งานแล้ว ✅');
  console.log('  เปิดเบราว์เซอร์ไปที่: http://localhost:' + PORT);
  console.log('  ข้อมูลจะถูกเซฟลงไฟล์: ' + DATA_FILE);
  console.log('  (กด Ctrl+C ใน terminal นี้เพื่อปิดเซิร์ฟเวอร์)');
  console.log('');
});
