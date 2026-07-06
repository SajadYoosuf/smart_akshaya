import { getRows, appendRow, updateRowColumns } from './googleSheetsService';
import { SHEETS_CONFIG } from '../config/sheetsConfig';
import { getCurrentSession } from './googleSheetsAuth';

/**
 * Expected columns in the Attendance sheet:
 * 0: Date (DD-MM-YYYY)
 * 1: Name
 * 2: In Time (HH:MM AM/PM)
 * 3: Out Time (HH:MM AM/PM)
 * 4: Total Time
 */

export async function checkTodayAttendance(name) {
  try {
    const rows = await getRows(SHEETS_CONFIG.attendanceSheetName);
    if (!rows || rows.length <= 1) return null;

    const todayStr = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
    // Find row for today and this name
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 2) continue;
      
      const dateVal = (row[0] || '').toString().trim();
      const nameVal = (row[1] || '').toString().trim().toLowerCase();
      
      if ((dateVal === todayStr || dateVal === todayStr.replace(/\//g, '-')) && nameVal === name.toLowerCase()) {
        return {
          rowIndex: i + 1,
          date: dateVal,
          name: row[1] || '',
          inTime: row[2] || '',
          outTime: row[3] || '',
          totalTime: row[4] || ''
        };
      }
    }
    return null;
  } catch (err) {
    console.error("Error checking attendance:", err);
    return null;
  }
}

export async function markAttendanceIn() {
  const session = getCurrentSession();
  if (!session || session.role === 'admin') return; // Only staff and accountants mark attendance

  const existing = await checkTodayAttendance(session.name);
  if (existing) return; // Already marked today

  const now = new Date();
  const todayStr = now.toLocaleDateString('en-GB'); // DD/MM/YYYY
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const newRow = [
    todayStr,
    session.name,
    timeStr,
    '', // Out Time
    ''  // Total Time
  ];

  await appendRow(SHEETS_CONFIG.attendanceSheetName, newRow);
}

export async function markAttendanceOut() {
  const session = getCurrentSession();
  if (!session || session.role === 'admin') return; 

  const existing = await checkTodayAttendance(session.name);
  if (!existing) return; 

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  let totalTimeStr = '';
  try {
    const inTimeMatch = existing.inTime.match(/(\d+):(\d+)\s+(AM|PM)/i);
    if (inTimeMatch) {
      let hours = parseInt(inTimeMatch[1], 10);
      const minutes = parseInt(inTimeMatch[2], 10);
      const ampm = inTimeMatch[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      
      const inDate = new Date();
      inDate.setHours(hours, minutes, 0, 0);
      
      let diffMs = now - inDate;
      if (diffMs < 0) diffMs = 0;
      
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      totalTimeStr = `${diffHrs}h ${diffMins}m`;
    }
  } catch (e) {
    console.error("Failed to parse inTime for totalTime calculation", e);
  }

  // Update Out Time column (index 3) and Total Time (index 4)
  await updateRowColumns(SHEETS_CONFIG.attendanceSheetName, existing.rowIndex, {
    'out time': timeStr,
    'total time': totalTimeStr
  });
}
