const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Ensure filename is URL-safe
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeFilename = Buffer.from(file.originalname, 'latin1').toString('utf8')
      .replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, uniqueSuffix + '-' + safeFilename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, JPG, JPEG, and PNG files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get all reports (admin only)
router.get('/all', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin based on email
    if (req.user.email !== 'admin@htu.edu.jo') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // Join with users table and attachments to get reporter's information and attachments
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

    // Format dates for frontend
    const formattedReports = result.rows.map(report => ({
      ...report,
      submission_date: report.submission_date ? report.submission_date.toISOString().split('T')[0] : null,
      incident_date: report.incident_date ? report.incident_date.toISOString().split('T')[0] : null,
      attachments: report.attachments || []
    }));

    res.json(formattedReports);
  } catch (error) {
    console.error('Error fetching all reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update report status (admin only)
router.patch('/:reportId/status', authenticateToken, async (req, res) => {
  const { status } = req.body;
  
  try {
    // Check if user is admin based on email
    if (req.user.email !== 'admin@htu.edu.jo') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const result = await pool.query(
      'UPDATE reports SET status = $1 WHERE report_id = $2 RETURNING *',
      [status, req.params.reportId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's reports
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.*,
        json_agg(
          json_build_object(
            'attachment_id', a.attachment_id,
            'file_path', a.file_path
          )
        ) FILTER (WHERE a.attachment_id IS NOT NULL) as attachments
      FROM reports r
      LEFT JOIN attachments a ON r.report_id = a.report_id
      WHERE r.user_id = $1
      GROUP BY r.report_id
      ORDER BY r.submission_date DESC
    `, [req.params.userId]);

    // Format the response
    const formattedReports = result.rows.map(report => ({
      ...report,
      attachments: report.attachments || []
    }));

    res.json(formattedReports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single report by ID
router.get('/:reportId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.*,
        json_agg(
          json_build_object(
            'attachment_id', a.attachment_id,
            'file_path', a.file_path
          )
        ) FILTER (WHERE a.attachment_id IS NOT NULL) as attachments
      FROM reports r
      LEFT JOIN attachments a ON r.report_id = a.report_id
      WHERE r.report_id = $1 AND r.user_id = $2
      GROUP BY r.report_id, r.user_id, r.incident_date, r.incident_time, 
               r.location, r.submission_date, r.incident_type, r.description, 
               r.witnesses, r.status, r.admin_comment
    `, [req.params.reportId, req.user.user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Report not found or unauthorized' });
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

// Get a single report by ID (admin route)
router.get('/admin/view/:reportId', authenticateToken, async (req, res) => {
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

// Create a new report
router.post('/', authenticateToken, async (req, res) => {
  const { 
    incident_date, 
    incident_time, 
    location, 
    submission_date,
    incident_type, 
    description, 
    witnesses 
  } = req.body;
  const user_id = req.user.user_id;

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
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a report
router.put('/:reportId', authenticateToken, async (req, res) => {
  const { 
    incident_date, 
    incident_time, 
    location, 
    submission_date,
    incident_type, 
    description, 
    witnesses 
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE reports 
       SET incident_date = $1, 
           incident_time = $2, 
           location = $3, 
           submission_date = $4, 
           incident_type = $5, 
           description = $6, 
           witnesses = $7
       WHERE report_id = $8 AND user_id = $9 
       RETURNING *`,
      [
        incident_date, 
        incident_time, 
        location, 
        submission_date,
        incident_type, 
        description, 
        witnesses,
        req.params.reportId,
        req.user.user_id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Report not found or unauthorized' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete report
router.delete('/:reportId', authenticateToken, async (req, res) => {
  try {
    let query = 'DELETE FROM reports WHERE report_id = $1';
    const params = [req.params.reportId];

    // If not admin, can only delete own reports
    if (req.user.email !== 'admin@htu.edu.jo') {
      query += ' AND user_id = $2';
      params.push(req.user.user_id);
    }

    const result = await pool.query(query + ' RETURNING *', params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Report not found or unauthorized' });
    }

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload attachment
router.post('/attachment', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check if report_id is provided
    if (!req.body.report_id) {
      return res.status(400).json({ message: 'Report ID is required' });
    }

    console.log('File upload request:', {
      file: req.file,
      reportId: req.body.report_id,
      userId: req.user.user_id
    });

    // Check if the report exists and belongs to the user
    const reportCheck = await pool.query(
      'SELECT * FROM reports WHERE report_id = $1 AND user_id = $2',
      [req.body.report_id, req.user.user_id]
    );

    if (reportCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Report not found or unauthorized' });
    }

    // Insert the attachment with the filename only
    const result = await pool.query(
      'INSERT INTO attachments (report_id, file_path) VALUES ($1, $2) RETURNING *',
      [req.body.report_id, req.file.filename]
    );

    console.log('File uploaded successfully:', {
      attachment: result.rows[0],
      filename: req.file.filename
    });

    res.status(201).json({
      message: 'File uploaded successfully',
      attachment: {
        ...result.rows[0],
        file_url: `/api/reports/download/${req.file.filename}`
      }
    });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    
    // Check if it's a multer error
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size exceeds the 5MB limit' });
    }
    
    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: 'Server error while uploading file' });
  }
});

// Download attachment
router.get('/download/:filename', authenticateToken, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);

    console.log('Download request:', {
      filename,
      filePath,
      exists: fs.existsSync(filePath),
      userEmail: req.user.email
    });

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if the user has access to this file
    const fileCheck = await pool.query(`
      SELECT a.*, r.user_id, r.report_id
      FROM attachments a 
      JOIN reports r ON a.report_id = r.report_id 
      WHERE a.file_path = $1
    `, [filename]);

    console.log('Database check result:', {
      fileFound: fileCheck.rows.length > 0,
      filename: filename,
      query: fileCheck.query,
      rows: fileCheck.rows
    });

    if (fileCheck.rows.length === 0) {
      console.error('File not found in database:', filename);
      return res.status(404).json({ message: 'File not found in database' });
    }

    // Check if the user owns the report or is an admin
    if (req.user.email !== 'admin@htu.edu.jo' && fileCheck.rows[0].user_id !== req.user.user_id) {
      console.error('Unauthorized access:', {
        fileOwner: fileCheck.rows[0].user_id,
        requestingUser: req.user.user_id,
        userEmail: req.user.email
      });
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error downloading file' });
      }
    });

  } catch (error) {
    console.error('Error in download route:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Error downloading file',
        error: error.message
      });
    }
  }
});

// Delete attachment
router.delete('/attachment/:attachmentId', authenticateToken, async (req, res) => {
  try {
    const attachmentId = req.params.attachmentId;

    // First get the attachment details to check ownership and get the filename
    const attachmentCheck = await pool.query(`
      SELECT a.*, r.user_id, r.report_id
      FROM attachments a 
      JOIN reports r ON a.report_id = r.report_id 
      WHERE a.attachment_id = $1
    `, [attachmentId]);

    if (attachmentCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Attachment not found' 
      });
    }

    // Check if the user owns the report or is an admin
    if (req.user.email !== 'admin@htu.edu.jo' && attachmentCheck.rows[0].user_id !== req.user.user_id) {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized' 
      });
    }

    const filePath = path.join(uploadsDir, attachmentCheck.rows[0].file_path);

    // Delete from database first
    const deleteResult = await pool.query(
      'DELETE FROM attachments WHERE attachment_id = $1 RETURNING *', 
      [attachmentId]
    );

    if (deleteResult.rows.length === 0) {
      return res.status(500).json({ 
        success: false,
        message: 'Failed to delete attachment from database' 
      });
    }

    // Then try to delete the file
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
      // Log the error but continue since database record is deleted
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Attachment deleted successfully',
      data: {
        attachment_id: attachmentId,
        report_id: attachmentCheck.rows[0].report_id
      }
    });

  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting attachment',
      error: error.message 
    });
  }
});

module.exports = router;
