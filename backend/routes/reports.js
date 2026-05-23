const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

// Middleware to verify token
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Get all reports
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reports ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get my reports
router.get('/mine', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reports WHERE submitted_by = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit a report
router.post('/', auth, async (req, res) => {
  const { title, category, description, location } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO reports (title, category, description, location, submitted_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, category, description, location, req.user.id]
    );
    const report = result.rows[0];
    await pool.query(
      'INSERT INTO report_updates (report_id, update_text) VALUES ($1, $2)',
      [report.id, 'Report submitted by citizen. Awaiting authority review.']
    );
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update report status (authority only)
router.patch('/:id/status', auth, async (req, res) => {
  if (req.user.role !== 'authority') return res.status(403).json({ error: 'Not authorized' });
  const { status, update_text, alert_radius } = req.body;
  try {
    const result = await pool.query(
      'UPDATE reports SET status = $1, alert_issued = $2, alert_radius = $3 WHERE id = $4 RETURNING *',
      [status, status === 'verified', alert_radius || null, req.params.id]
    );
    await pool.query(
      'INSERT INTO report_updates (report_id, update_text) VALUES ($1, $2)',
      [req.params.id, update_text || `Status updated to ${status}`]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;