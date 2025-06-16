const pool = require('../config/db');

// Create a new report
const createReport = async (req, res) => {
  const { incident_date, incident_time, location, incident_type, description, witnesses } = req.body;
  const user_id = req.user.userId; // From auth middleware
  const submission_date = new Date().toISOString().split('T')[0];

  try {
    const result = await pool.query(
      `INSERT INTO reports 
       (user_id, incident_date, incident_time, location, submission_date, incident_type, description, witnesses) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [user_id, incident_date, incident_time, location, submission_date, incident_type, description, witnesses]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Error creating report' });
  }
};

// Get reports for a specific user
const getUserReports = async (req, res) => {
  const user_id = req.user.userId; // From auth middleware

  try {
    const result = await pool.query(
      `SELECT r.*, a.attachment_id, a.file_path 
       FROM reports r 
       LEFT JOIN attachments a ON r.report_id = a.report_id 
       WHERE r.user_id = $1 
       ORDER BY r.submission_date DESC`,
      [user_id]
    );

    // Group attachments by report
    const reports = result.rows.reduce((acc, row) => {
      const reportId = row.report_id;
      if (!acc[reportId]) {
        acc[reportId] = {
          ...row,
          attachments: []
        };
        delete acc[reportId].attachment_id;
        delete acc[reportId].file_path;
      }
      if (row.attachment_id) {
        acc[reportId].attachments.push({
          id: row.attachment_id,
          file_path: row.file_path
        });
      }
      return acc;
    }, {});

    res.json(Object.values(reports));
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Error fetching reports' });
  }
};

// Update report status
const updateReportStatus = async (req, res) => {
  const { report_id } = req.params;
  const { status, admin_comment } = req.body;
  const user_id = req.user.userId;

  try {
    // First check if the report belongs to the user
    const checkReport = await pool.query(
      'SELECT * FROM reports WHERE report_id = $1 AND user_id = $2',
      [report_id, user_id]
    );

    if (checkReport.rows.length === 0) {
      return res.status(404).json({ message: 'Report not found or unauthorized' });
    }

    const result = await pool.query(
      'UPDATE reports SET status = $1, admin_comment = $2 WHERE report_id = $3 RETURNING *',
      [status, admin_comment, report_id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ message: 'Error updating report' });
  }
};

// Upload attachment for a report
const uploadAttachment = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const { report_id } = req.body;
  const file_path = req.file.path;
  const user_id = req.user.userId;

  try {
    // Check if the report belongs to the user
    const checkReport = await pool.query(
      'SELECT * FROM reports WHERE report_id = $1 AND user_id = $2',
      [report_id, user_id]
    );

    if (checkReport.rows.length === 0) {
      return res.status(404).json({ message: 'Report not found or unauthorized' });
    }

    const result = await pool.query(
      'INSERT INTO attachments (report_id, file_path) VALUES ($1, $2) RETURNING *',
      [report_id, file_path]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({ message: 'Error uploading attachment' });
  }
};

module.exports = {
  createReport,
  getUserReports,
  updateReportStatus,
  uploadAttachment
}; 