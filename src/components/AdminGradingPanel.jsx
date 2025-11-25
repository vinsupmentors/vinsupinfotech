import React, { useState, useEffect } from 'react';
import { post } from '../api';
import '../styles/admin.css';

// AdminGradingPanel: The main page listing students
export default function AdminGradingPanel() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [msg, setMsg] = useState('');

    async function loadStudents() {
        setLoading(true);
        setMsg('');
        try {
            // Call the new backend endpoint to get all aggregated student data
            const r = await post('getStudentsForAdmin', {});
            
            if (r.status === 'ok' && Array.isArray(r.students)) {
                setStudents(r.students);
            } else {
                setMsg(r.message || 'Error fetching student list.');
                setStudents([]);
            }
        } catch (err) {
            setMsg('Network error loading students: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadStudents();
    }, []);

    const openGrading = (student) => {
        // Prepare initial grading form state
        setSelectedStudent({
            ...student,
            // Determine the next uncompleted round for default selection
            roundName: student.gd === 0 ? 'Group Discussion' : 
                       student.tech === 0 ? 'Technical' : 
                       'HR',
            marks: 0,
            remarks: ''
        });
    };

    const handleGradeSubmit = async (gradeData) => {
        setLoading(true);
        setMsg('');
        
        try {
            // Submit the grades to the backend
            const r = await post('saveRoundMarks', {
                studentId: gradeData.id, // Use 'id' from the aggregated data
                roundName: gradeData.roundName,
                marks: gradeData.marks,
                remarks: gradeData.remarks,
                isCompleted: true
            });

            if (r.status === 'ok') {
                // NOTE: Using alert here temporarily, but in final UX, use a custom modal
                alert(`Successfully saved marks for ${gradeData.name} in ${gradeData.roundName}. Refreshing data...`);
                setSelectedStudent(null);
                loadStudents(); // Refresh list to update marks
            } else {
                setMsg(r.message || 'Error saving marks.');
            }
        } catch (err) {
            setMsg('Network error saving marks: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-container">
            <h1 className="admin-title">Staff Grading Panel</h1>
            <p className="admin-subtitle">Manage assessment rounds (GD, Technical, HR) for candidates who have completed the initial tests.</p>
            
            {msg && <div style={{color:'red', marginBottom:'15px'}}>{msg}</div>}

            <table className="student-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Name (ID)</th>
                        <th>Role/Domain</th>
                        <th>Apt/Dom Scores</th>
                        <th>Int. Scores (GD/Tech/HR)</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan="7" style={{textAlign:'center'}}>Loading students...</td></tr>
                    ) : (
                        students.map(s => (
                            <tr key={s.id}>
                                <td>#{s.rank}</td>
                                <td>{s.name} <div style={{fontSize:'0.75rem', color:'#9ca3af'}}>({s.id})</div></td>
                                <td>{s.domain}</td>
                                <td>{s.aptitude} / {s.domain_tech}</td>
                                <td>{s.gd} / {s.tech} / {s.hr}</td>
                                <td style={{fontWeight: 600, color: s.status.includes('Pending') ? '#d97706' : '#10b981'}}>{s.status}</td>
                                <td>
                                    <button className="grade-button" onClick={() => openGrading(s)}>
                                        Grade Rounds
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Grading Modal */}
            {selectedStudent && (
                <GradingModal 
                    student={selectedStudent} 
                    onClose={() => setSelectedStudent(null)}
                    onSubmit={handleGradeSubmit}
                />
            )}
        </div>
    );
}

// Grading Modal Component
function GradingModal({ student, onClose, onSubmit }) {
    const [roundName, setRoundName] = useState(student.roundName);
    // Use the score data from the student prop to pre-fill marks
    // Note: The aggregated scores are passed as apt_score, gd_score, tech_score, etc.
    const [marks, setMarks] = useState(student.gd || 0); // Default marks to GD score
    const [remarks, setRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Effect to update marks when roundName changes
    useEffect(() => {
        const keyMap = {
            "Group Discussion": student.gd,
            "Technical": student.tech,
            "HR": student.hr
        };
        setMarks(keyMap[roundName] || 0);
    }, [roundName, student]);


    const handleMarksChange = (e) => {
        const value = e.target.value;
        if (value === '' || (!isNaN(value) && value >= 0 && value <= 100)) {
            setMarks(value);
        }
    };
    
    const handleRoundChange = (e) => {
        const newRound = e.target.value;
        setRoundName(newRound);
        // Marks will update via useEffect
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (marks === '' || marks < 0 || marks > 100) {
            alert('Please enter valid marks between 0 and 100.');
            return;
        }
        setIsSubmitting(true);
        onSubmit({
            id: student.id, 
            name: student.name,
            roundName,
            marks: Number(marks),
            remarks
        });
    };

    return (
        <div className="grading-modal-overlay">
            <div className="grading-form-card">
                <h3>Grading: {student.name} ({student.id})</h3>
                <p style={{marginBottom: '1rem', color: '#6b7280'}}>Domain: {student.domain}</p>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group-admin">
                        <label>Select Round</label>
                        <select value={roundName} onChange={handleRoundChange} disabled={isSubmitting}>
                            <option value="Group Discussion">Group Discussion (Current: {student.gd})</option>
                            <option value="Technical">Technical Interview (Current: {student.tech})</option>
                            <option value="HR">HR Round (Current: {student.hr})</option>
                        </select>
                    </div>

                    <div className="form-group-admin">
                        <label>Marks (0-100)</label>
                        <input 
                            type="number" 
                            value={marks} 
                            onChange={handleMarksChange} 
                            min="0" 
                            max="100" 
                            placeholder="Enter marks"
                            disabled={isSubmitting}
                            required
                        />
                    </div>

                    <div className="form-group-admin">
                        <label>Remarks / Feedback</label>
                        <textarea 
                            value={remarks} 
                            onChange={(e) => setRemarks(e.target.value)} 
                            placeholder="Brief summary of performance"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button type="submit" className="grade-button" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : `Save Marks`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}