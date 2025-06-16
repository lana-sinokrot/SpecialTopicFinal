const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const pool = require('../config/db');

// Get a single report by ID (admin only)
router.get('/reports/:reportId', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin based on email
    if (!isAdmin(req.user.email)) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const result = await pool.query(`
      SELECT 
        r.*,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email,
        json_agg(
          json_build_object(
            'attachment_id', a.attachment_id,
            'file_path', a.file_path
          )
        ) FILTER (WHERE a.attachment_id IS NOT NULL) as attachments
      FROM reports r
      JOIN users u ON r.user_id = u.user_id
      LEFT JOIN attachments a ON r.report_id = a.report_id
      WHERE r.report_id = $1
      GROUP BY r.report_id, u.user_id, u.first_name, u.last_name, u.email
    `, [req.params.reportId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const report = {
      ...result.rows[0],
      attachments: result.rows[0].attachments || []
    };

    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all reports (admin only)
router.get('/reports', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin based on email
    if (!isAdmin(req.user.email)) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const result = await pool.query(`
      SELECT 
        r.*,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email,
        json_agg(
          json_build_object(
            'attachment_id', a.attachment_id,
            'file_path', a.file_path
          )
        ) FILTER (WHERE a.attachment_id IS NOT NULL) as attachments
      FROM reports r
      JOIN users u ON r.user_id = u.user_id
      LEFT JOIN attachments a ON r.report_id = a.report_id
      GROUP BY r.report_id, u.user_id, u.first_name, u.last_name, u.email
      ORDER BY r.submission_date DESC
    `);

    const formattedReports = result.rows.map(report => ({
      ...report,
      attachments: report.attachments || []
    }));

    res.json(formattedReports);
  } catch (error) {
    console.error('Error fetching all reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add admin comment to a report
router.post('/reports/:reportId/comment', authenticateToken, async (req, res) => {
  try {
    console.log('Comment request received:', {
      reportId: req.params.reportId,
      userEmail: req.user.email,
      body: req.body
    });

    // Check if user is admin based on email
    if (!isAdmin(req.user.email)) {
      console.log('Access denied - not admin:', req.user.email);
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { admin_comment } = req.body;
    
    if (!admin_comment) {
      console.log('Comment missing in request body');
      return res.status(400).json({ message: 'Comment is required' });
    }

    // First check if report exists
    const checkReport = await pool.query('SELECT report_id FROM reports WHERE report_id = $1', [req.params.reportId]);
    
    if (checkReport.rows.length === 0) {
      console.log('Report not found:', req.params.reportId);
      return res.status(404).json({ message: 'Report not found' });
    }

    console.log('Executing update query for report:', req.params.reportId);
    const result = await pool.query(`
      UPDATE reports 
      SET admin_comment = $1 
      WHERE report_id = $2 
      RETURNING report_id, admin_comment
    `, [admin_comment, req.params.reportId]);

    console.log('Update query result:', result.rows);

    res.json({
      success: true,
      message: 'Comment added successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error adding admin comment:', {
      error: error.message,
      stack: error.stack,
      reportId: req.params.reportId
    });
    
    // Ensure we always send a JSON response
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router; 