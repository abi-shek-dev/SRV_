import pool from '../db/pool.js';

const Library = {
  // ── BOOKS ──
  async createBook({ title, author, isbn, category, totalCopies, shelfLocation }) {
    const copies = totalCopies || 1;
    const [result] = await pool.query(
      `INSERT INTO library_books (title, author, isbn, category, total_copies, available_copies, shelf_location)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, author || '', isbn || '', category || 'General', copies, copies, shelfLocation || '']
    );
    return this.findBookById(result.insertId);
  },

  async findAllBooks(filters = {}) {
    let sql = 'SELECT * FROM library_books';
    const params = [];
    const conds = [];
    if (filters.category) { conds.push('category = ?'); params.push(filters.category); }
    if (filters.search) { conds.push('(title LIKE ? OR author LIKE ? OR isbn LIKE ?)'); params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`); }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' ORDER BY title ASC';
    const [rows] = await pool.query(sql, params);
    return rows.map(mapBook);
  },

  async findBookById(id) {
    const [rows] = await pool.query('SELECT * FROM library_books WHERE id = ?', [id]);
    return rows[0] ? mapBook(rows[0]) : null;
  },

  async updateBook(id, data) {
    const fields = [];
    const params = [];
    if (data.title !== undefined) { fields.push('title = ?'); params.push(data.title); }
    if (data.author !== undefined) { fields.push('author = ?'); params.push(data.author); }
    if (data.isbn !== undefined) { fields.push('isbn = ?'); params.push(data.isbn); }
    if (data.category !== undefined) { fields.push('category = ?'); params.push(data.category); }
    if (data.totalCopies !== undefined) {
      fields.push('total_copies = ?');
      params.push(data.totalCopies);
    }
    if (data.shelfLocation !== undefined) { fields.push('shelf_location = ?'); params.push(data.shelfLocation); }
    if (!fields.length) return this.findBookById(id);
    params.push(id);
    await pool.query(`UPDATE library_books SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findBookById(id);
  },

  async deleteBook(id) {
    await pool.query('DELETE FROM library_books WHERE id = ?', [id]);
  },

  async getCategories() {
    const [rows] = await pool.query('SELECT DISTINCT category FROM library_books ORDER BY category');
    return rows.map(r => r.category);
  },

  // ── ISSUE / RETURN ──
  async issueBook({ bookId, studentId, issuedBy, dueDate }) {
    // Check availability
    const book = await this.findBookById(bookId);
    if (!book || book.availableCopies <= 0) throw new Error('Book not available');

    const issuedDate = new Date().toISOString().split('T')[0];
    const [result] = await pool.query(
      `INSERT INTO library_issues (book_id, student_id, issued_by, issued_date, due_date, status)
       VALUES (?, ?, ?, ?, ?, 'ISSUED')`,
      [bookId, studentId, issuedBy, issuedDate, dueDate]
    );

    // Decrease available copies
    await pool.query('UPDATE library_books SET available_copies = available_copies - 1 WHERE id = ? AND available_copies > 0', [bookId]);

    return this.findIssueById(result.insertId);
  },

  async returnBook(issueId) {
    const issue = await this.findIssueById(issueId);
    if (!issue) throw new Error('Issue not found');
    if (issue.status === 'RETURNED') throw new Error('Already returned');

    const returnedDate = new Date().toISOString().split('T')[0];
    // Calculate fine (₹5 per day overdue)
    const dueDate = new Date(issue.dueDate);
    const today = new Date();
    let fine = 0;
    if (today > dueDate) {
      const overdueDays = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
      fine = overdueDays * 5;
    }

    await pool.query(
      `UPDATE library_issues SET status = 'RETURNED', returned_date = ?, fine_amount = ? WHERE id = ?`,
      [returnedDate, fine, issueId]
    );

    // Increase available copies
    await pool.query('UPDATE library_books SET available_copies = available_copies + 1 WHERE id = ?', [issue.bookId]);

    return this.findIssueById(issueId);
  },

  async findIssueById(id) {
    const [rows] = await pool.query(
      `SELECT li.*, lb.title AS bookTitle, lb.author AS bookAuthor, s.name AS studentName, s.srv_number AS srvNumber, s.grade, s.section
       FROM library_issues li
       JOIN library_books lb ON li.book_id = lb.id
       JOIN students s ON li.student_id = s.id
       WHERE li.id = ?`, [id]
    );
    return rows[0] ? mapIssue(rows[0]) : null;
  },

  async findAllIssues(filters = {}) {
    let sql = `SELECT li.*, lb.title AS bookTitle, lb.author AS bookAuthor, s.name AS studentName, s.srv_number AS srvNumber, s.grade, s.section
       FROM library_issues li
       JOIN library_books lb ON li.book_id = lb.id
       JOIN students s ON li.student_id = s.id`;
    const params = [];
    const conds = [];
    if (filters.status) { conds.push('li.status = ?'); params.push(filters.status); }
    if (filters.studentId) { conds.push('li.student_id = ?'); params.push(filters.studentId); }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' ORDER BY li.created_at DESC LIMIT 200';
    const [rows] = await pool.query(sql, params);
    return rows.map(mapIssue);
  },

  async findOverdue() {
    const today = new Date().toISOString().split('T')[0];
    // Auto-update status of overdue books
    await pool.query(`UPDATE library_issues SET status = 'OVERDUE' WHERE status = 'ISSUED' AND due_date < ?`, [today]);
    return this.findAllIssues({ status: 'OVERDUE' });
  },

  async findByStudent(studentId) {
    return this.findAllIssues({ studentId });
  },

  async getStats() {
    const [[{ totalBooks }]] = await pool.query('SELECT COUNT(*) AS totalBooks FROM library_books');
    const [[{ totalIssued }]] = await pool.query("SELECT COUNT(*) AS totalIssued FROM library_issues WHERE status = 'ISSUED'");
    const [[{ totalOverdue }]] = await pool.query("SELECT COUNT(*) AS totalOverdue FROM library_issues WHERE status = 'OVERDUE'");
    const [[{ totalReturned }]] = await pool.query("SELECT COUNT(*) AS totalReturned FROM library_issues WHERE status = 'RETURNED'");
    return { totalBooks, totalIssued, totalOverdue, totalReturned };
  }
};

function mapBook(r) {
  return {
    _id: r.id, title: r.title, author: r.author, isbn: r.isbn,
    category: r.category, totalCopies: r.total_copies,
    availableCopies: r.available_copies, shelfLocation: r.shelf_location,
    createdAt: r.created_at
  };
}

function mapIssue(r) {
  return {
    _id: r.id, bookId: r.book_id, studentId: r.student_id,
    bookTitle: r.bookTitle, bookAuthor: r.bookAuthor,
    studentName: r.studentName, srvNumber: r.srvNumber,
    grade: r.grade, section: r.section,
    issuedDate: r.issued_date, dueDate: r.due_date,
    returnedDate: r.returned_date, status: r.status,
    fineAmount: parseFloat(r.fine_amount || 0),
    createdAt: r.created_at
  };
}

export default Library;
