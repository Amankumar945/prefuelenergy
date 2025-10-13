const fs = require('fs')
const path = require('path')

// Resolve storage file path from env or default to server/data.json
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, '..', 'data.json')
const ROTATE_DIR = process.env.DATA_BACKUP_DIR || path.join(__dirname, '..', 'backups')
const MAX_BACKUPS = Number(process.env.DATA_BACKUP_KEEP || 5)

function loadSnapshot() {
  try {
    if (!fs.existsSync(DATA_FILE)) return null
    const raw = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch (_) {
    return null
  }
}

function saveSnapshot(snapshot) {
  try {
    const dir = path.dirname(DATA_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const json = JSON.stringify(snapshot, null, 2)
    fs.writeFileSync(DATA_FILE, json, 'utf-8')
    // simple rotation
    try {
      if (!fs.existsSync(ROTATE_DIR)) fs.mkdirSync(ROTATE_DIR, { recursive: true })
      const stamp = new Date().toISOString().replace(/[:.]/g,'-')
      const backupFile = path.join(ROTATE_DIR, `data-${stamp}.json`)
      fs.writeFileSync(backupFile, json, 'utf-8')
      const files = fs.readdirSync(ROTATE_DIR).filter(f=>f.endsWith('.json')).sort()
      while (files.length > MAX_BACKUPS) {
        const oldest = files.shift()
        try { fs.unlinkSync(path.join(ROTATE_DIR, oldest)) } catch (_) {}
      }
    } catch (_) {}
    return true
  } catch (_) {
    return false
  }
}

module.exports = {
  DATA_FILE,
  loadSnapshot,
  saveSnapshot,
}
