// models/message-model.js
const pool = require("../database/")

/**
 * Get all messages
 * @returns {Array} Array of message objects
 */
async function getAllMessages() {
  try {
    const sql = `
      SELECT m.*, a.account_firstname, a.account_lastname, a.account_email
      FROM message m
      LEFT JOIN account a ON m.account_id = a.account_id
      ORDER BY m.created_at DESC
    `
    const result = await pool.query(sql)
    return result.rows
  } catch (error) {
    console.error("Error in getAllMessages:", error)
    return []
  }
}

/**
 * Get messages by account ID
 * @param {Number} account_id - Account ID
 * @returns {Array} Array of message objects
 */
async function getMessagesByAccountId(account_id) {
  try {
    const sql = `
      SELECT m.*, a.account_firstname, a.account_lastname 
      FROM message m
      JOIN account a ON m.account_id = a.account_id
      WHERE m.account_id = $1
      ORDER BY m.created_at DESC
    `
    const result = await pool.query(sql, [account_id])
    return result.rows
  } catch (error) {
    console.error("Error in getMessagesByAccountId:", error)
    return []
  }
}

/**
 * Get message by ID
 * @param {Number} message_id - Message ID
 * @returns {Object} Message object
 */
async function getMessageById(message_id) {
  try {
    const sql = `
      SELECT m.*, a.account_firstname, a.account_lastname, a.account_email, a.account_phone
      FROM message m
      LEFT JOIN account a ON m.account_id = a.account_id
      WHERE m.message_id = $1
    `
    const result = await pool.query(sql, [message_id])
    return result.rows[0]
  } catch (error) {
    console.error("Error in getMessageById:", error)
    return null
  }
}

/**
 * Create new message
 * @param {Object} message - Message data
 * @returns {Object} Created message
 */
async function createMessage(message) {
  try {
    const { 
      account_id, 
      guest_name,
      guest_email,
      guest_phone,
      message_subject,
      message_body,
      parent_id = null
    } = message
    
    // Check if the message table has parent_id and is_read columns
    let hasParentId = false;
    let hasIsRead = false;
    
    try {
      const columnsQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'message' 
      `;
      const columnsResult = await pool.query(columnsQuery);
      const columns = columnsResult.rows.map(row => row.column_name);
      
      hasParentId = columns.includes('parent_id');
      hasIsRead = columns.includes('is_read');
    } catch (error) {
      console.error("Error checking message table columns:", error);
    }
    
    let sql = '';
    let values = [];
    
    if (hasParentId && hasIsRead) {
      // Both new columns exist
      sql = `
        INSERT INTO message (
          account_id,
          guest_name,
          guest_email,
          guest_phone,
          message_subject,
          message_body,
          parent_id,
          is_read
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      values = [
        account_id,
        guest_name,
        guest_email,
        guest_phone,
        message_subject,
        message_body,
        parent_id,
        false
      ];
    } else if (hasParentId) {
      // Only parent_id exists
      sql = `
        INSERT INTO message (
          account_id,
          guest_name,
          guest_email,
          guest_phone,
          message_subject,
          message_body,
          parent_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      values = [
        account_id,
        guest_name,
        guest_email,
        guest_phone,
        message_subject,
        message_body,
        parent_id
      ];
    } else if (hasIsRead) {
      // Only is_read exists
      sql = `
        INSERT INTO message (
          account_id,
          guest_name,
          guest_email,
          guest_phone,
          message_subject,
          message_body,
          is_read
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      values = [
        account_id,
        guest_name,
        guest_email,
        guest_phone,
        message_subject,
        message_body,
        false
      ];
    } else {
      // Neither column exists
      sql = `
        INSERT INTO message (
          account_id,
          guest_name,
          guest_email,
          guest_phone,
          message_subject,
          message_body
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      values = [
        account_id,
        guest_name,
        guest_email,
        guest_phone,
        message_subject,
        message_body
      ];
    }
    
    const result = await pool.query(sql, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error in createMessage:", error)
    throw error
  }
}

/**
 * Update message read status
 * @param {Number} message_id - Message ID
 * @param {Boolean} is_read - Read status
 * @returns {Boolean} Success status
 */
async function updateMessageReadStatus(message_id, is_read) {
  try {
    // Check if is_read column exists
    const columnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'message' 
      AND column_name = 'is_read'
    `;
    const columnResult = await pool.query(columnQuery);
    const hasIsRead = columnResult.rowCount > 0;
    
    if (!hasIsRead) {
      console.error("is_read column does not exist in message table");
      return false;
    }
    
    const sql = `
      UPDATE message
      SET is_read = $1
      WHERE message_id = $2
      RETURNING *
    `;
    const result = await pool.query(sql, [is_read, message_id]);
    return result.rowCount > 0;
  } catch (error) {
    console.error("Error in updateMessageReadStatus:", error);
    return false;
  }
}

/**
 * Get thread messages
 * @param {Number} root_message_id - Root message ID
 * @returns {Array} Array of messages in thread
 */
async function getMessageThread(root_message_id) {
  try {
    // Check if parent_id column exists
    const columnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'message' 
      AND column_name = 'parent_id'
    `;
    const columnResult = await pool.query(columnQuery);
    const hasParentId = columnResult.rowCount > 0;
    
    if (!hasParentId) {
      // If parent_id doesn't exist, just return the single message
      const sql = `
        SELECT m.*, a.account_firstname, a.account_lastname, a.account_email,
               a.account_type
        FROM message m
        LEFT JOIN account a ON m.account_id = a.account_id
        WHERE m.message_id = $1
      `;
      const result = await pool.query(sql, [root_message_id]);
      return result.rows;
    }
    
    // First get the root message if it has a parent
    let rootId = root_message_id;
    const checkSql = `SELECT parent_id FROM message WHERE message_id = $1 AND parent_id IS NOT NULL`;
    const checkResult = await pool.query(checkSql, [root_message_id]);
    
    if (checkResult.rows.length > 0) {
      rootId = checkResult.rows[0].parent_id;
    }
    
    // Now get all messages in the thread
    const sql = `
      WITH RECURSIVE thread AS (
        SELECT m.*, a.account_firstname, a.account_lastname, a.account_email,
               a.account_type
        FROM message m
        LEFT JOIN account a ON m.account_id = a.account_id
        WHERE m.message_id = $1
        
        UNION ALL
        
        SELECT m.*, a.account_firstname, a.account_lastname, a.account_email,
               a.account_type
        FROM message m
        JOIN thread t ON m.parent_id = t.message_id OR m.message_id = t.parent_id
        LEFT JOIN account a ON m.account_id = a.account_id
      )
      SELECT DISTINCT * FROM thread
      ORDER BY created_at ASC
    `;
    
    const result = await pool.query(sql, [rootId]);
    return result.rows;
  } catch (error) {
    console.error("Error in getMessageThread:", error);
    return [];
  }
}

/**
 * Count unread messages
 * @returns {Number} Count of unread messages
 */
async function countUnreadMessages() {
  try {
    // Check if is_read column exists
    const columnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'message' 
      AND column_name = 'is_read'
    `;
    const columnResult = await pool.query(columnQuery);
    const hasIsRead = columnResult.rowCount > 0;
    
    if (!hasIsRead) {
      console.error("is_read column does not exist in message table");
      return 0;
    }
    
    const sql = `
      SELECT COUNT(*) as count
      FROM message
      WHERE is_read = false
    `;
    const result = await pool.query(sql);
    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error("Error in countUnreadMessages:", error);
    return 0;
  }
}

module.exports = {
  getAllMessages,
  getMessagesByAccountId,
  getMessageById,
  createMessage,
  updateMessageReadStatus,
  getMessageThread,
  countUnreadMessages
}