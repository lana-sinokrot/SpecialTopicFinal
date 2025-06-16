const pool = require('../models/db');

exports.createReport = async (req, res) => {
  const {
    incident_date, incident_time, location, submission_date,
    incident_type, description, witnesses
  } = req.body;

  const { user_id } = req.user;

  const result = await pool.query(
    `INSERT INTO reports (
      user_id, incident_date, incident_time, location, submission_date,
      incident_type, description, witnesses
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING report_id`,
    [user_id, incident_date, incident_time, location, submission_date, incident_type, description, witnesses]
  );

  res.status(201).json({ report_id: result.rows[0].report_id });
};

exports.getUserReports = async (req, res) => {
  const { user_id } = req.user;

  const result = await pool.query('SELECT * FROM reports WHERE user_id = $1 ORDER BY report_id DESC', [user_id]);
  res.json(result.rows);
};

exports.updateReportStatus = async (req, res) => {
  const { report_id } = req.params;
  const { status, admin_comment } = req.body;

  await pool.query(
    'UPDATE reports SET status = $1, admin_comment = $2 WHERE report_id = $3',
    [status, admin_comment, report_id]
  );

  res.json({ message: 'Status updated' });
};

exports.uploadAttachment = async (req, res) => {
  const { report_id } = req.body;
  const file_path = req.file.path;

  await pool.query(
    'INSERT INTO attachments (report_id, file_path) VALUES ($1, $2)',
    [report_id, file_path]
  );

  res.status(201).json({ message: 'File uploaded' });
};
