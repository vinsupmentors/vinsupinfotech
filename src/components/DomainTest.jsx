import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ==========================================
// MOCK DEPENDENCIES (FOR PREVIEW ONLY)
// Remove these when copying to your project
// ==========================================

// 1. Mock API (Replace with: import { post } from '../api';)
const post = async (endpoint, payload) => {
  console.log(`[API] Call to ${endpoint}`, payload);
  await new Promise(r => setTimeout(r, 800)); // Simulate delay

  if (endpoint === 'getDomainQuestions') {
    return {
      status: 'ok',
      questions: Array.from({ length: 25 }, (_, i) => ({
        questionId: `q${i + 1}`,
        questionText: `This is a mock technical question #${i + 1}.`,
        optionA: "Option A",
        optionB: "Option B",
        optionC: "Option C",
        optionD: "Option D",
        optionE: "Not Sure"
      }))
    };
  }
  if (endpoint === 'submitDomainResult') {
    return { status: 'ok', message: 'Submitted successfully' };
  }
  return { status: 'error', message: 'Unknown endpoint' };
};

// 2. Mock Styles (Replace with: import '../styles/test.css';)
const Styles = () => (
  <style>{`
    .test-container { font-family: sans-serif; padding: 20px; display: flex; justify-content: center; background: #f3f4f6; min-height: 100vh; }
    .test-wrapper { display: flex; width: 100%; max-width: 1000px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .test-sidebar { width: 250px; background: #f8fafc; border-right: 1px solid #e2e8f0; padding: 20px; }
    .palette-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-top: 20px; }
    .q-bubble { width: 30px; height: 30px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; cursor: pointer; }
    .q-bubble.answered { background: #10b981; color: white; }
    .q-bubble.current { border: 2px solid #2563eb; font-weight: bold; }
    .test-main { flex: 1; display: flex; flex-direction: column; }
    .test-header { padding: 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .timer-box { font-weight: bold; color: #2563eb; background: #eff6ff; padding: 8px 12px; border-radius: 6px; }
    .timer-box.warning { color: #dc2626; background: #fef2f2; }
    .question-area { flex: 1; padding: 30px; }
    .question-text { font-size: 1.1rem; margin-bottom: 20px; line-height: 1.5; }
    .options-list { display: flex; flex-direction: column; gap: 10px; }
    .option-card { padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; display: flex; align-items: center; }
    .option-card:hover { background: #f8fafc; }
    .option-card.selected { border-color: #2563eb; background: #eff6ff; }
    .radio-circle { width: 16px; height: 16px; border: 2px solid #cbd5e1; border-radius: 50%; margin-right: 12px; }
    .option-card.selected .radio-circle { border-color: #2563eb; background: #2563eb; }
    .test-footer { padding: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; }
    .btn-nav { padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; font-weight: 600; }
    .btn-prev { background: #f1f5f9; color: #64748b; }
    .btn-next { background: #2563eb; color: white; }
    .btn-finish { background: #10b981; color: white; }
  `}</style>
);

// ALERT_TIME is 5 minutes (300 seconds)
const ALERT_TIME = 300;

export default function DomainTest({ studentId }) {
  const nav = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(45 * 60); 
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null); 
  const timerRef = useRef(null);

  useEffect(() => {
    // 1. Initial Data Fetch
    (async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const r = await post('getDomainQuestions', { studentId });
        if (r.status === 'ok' && Array.isArray(r.questions) && r.questions.length > 0) {
          setQuestions(r.questions.slice(0, 25));
        } else if (r.message && r.message.includes('No domain selected')) {
           // Specific error for domain not being set yet
           setErrorMsg('Domain role not selected. Please return to the Role Selection page.');
           setQuestions([]);
        } 
        else {
          setErrorMsg(r.message || 'No domain questions found for your selected role. Please verify QuestionBank data.');
          setQuestions([]);
        }
      } catch (err) {
        setErrorMsg('Network error loading questions. Ensure Apps Script is deployed correctly.');
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId, nav]);

  useEffect(() => {
    // 2. Timer Setup
    if (questions.length > 0 && !loading) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            finishTest(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [questions, loading]);

  // --- NEW: Tab Switching Detection ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Updated Alert Message to be clearer
        alert("Tab switch detected! Auto-submitting your test with the answers you have marked so far.");
        finishTest(true, true); // auto=true, violation=true
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [answers]); // Dependency on answers ensures we submit the latest state

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleOptionSelect = (opt) => {
    const currentQId = questions[index].questionId;
    setAnswers((prev) => ({ ...prev, [currentQId]: opt }));
  };

  const goToNext = () => {
    if (index < questions.length - 1) {
      setIndex(index + 1);
    } else {
      finishTest(false);
    }
  };

  const goToPrev = () => {
    if (index > 0) setIndex(index - 1);
  };

  const jumpToQuestion = (i) => {
    setIndex(i);
  };

  // Updated finishTest to handle violations
  const finishTest = async (auto = false, violation = false) => {
    clearInterval(timerRef.current);
    
    // If it's not auto-submit AND not a violation, ask for confirmation
    if (!auto && !violation && !window.confirm("Are you sure you want to submit your technical test?")) {
        return; 
    }

    const payload = Object.keys(answers).map((qid) => ({
      questionId: qid,
      chosenOption: answers[qid],
    }));

    try {
      const r = await post('submitDomainResult', { 
        studentId, 
        answers: payload,
        violation: violation // Send violation flag to backend
      });

      if (r.status === 'ok') {
        if (violation) {
             // Confirm submission to user
             alert('Your test has been auto-submitted successfully due to tab switching.');
        } else {
             alert('Technical Test submitted successfully!');
        }
        nav('/checklist'); 
      } else {
        alert(r.message || 'Submission failed.');
      }
    } catch (err) {
      alert('Network error submitting test.');
    }
  };

  // --- RENDER FALLBACKS ---
  if (loading) return (
    <>
      <Styles />
      <div className="test-container" style={{alignItems:'center'}}>Loading Technical Assessment...</div>
    </>
  );
  if (errorMsg || !questions.length) return (
    <>
      <Styles />
      <div  className="test-container" style={{alignItems:'center', flexDirection:'column', padding: '100px'}}>
        <h2 style={{color: errorMsg ? '#b91c1c' : '#1a73e8'}}>
          {errorMsg ? 'Assessment Load Error' : 'Assessment Not Available'}
        </h2>
        <p style={{color: '#6b7280', fontSize:'1.1rem', textAlign: 'center'}}>{errorMsg || 'No questions were found for your selected domain. Please check the sheet configuration.'}</p>
        
        {errorMsg && errorMsg.includes('Domain role not selected') ? (
          <button onClick={() => nav('/select-role')} className="btn-save" style={{marginTop:'20px'}}>Go to Role Selection</button>
        ) : (
          <button onClick={() => nav('/checklist')} className="btn-save" style={{marginTop:'20px'}}>Go to Checklist</button>
        )}
      </div>
    </>
  );
  // --- END RENDER FALLBACKS ---


  // CRITICAL: Ensure currentQ exists before accessing properties
  const currentQ = questions[index];
  if (!currentQ) return null; 

  const isLast = index === questions.length - 1;

  return (
    <>
    <Styles />
    <div className="test-container">
      <div className="test-wrapper">
        
        <div className="test-sidebar">
          <div className="sidebar-header">
            <h4 className="sidebar-title">Question Palette</h4>
          </div>
          
          <div className="palette-grid">
            {questions.map((q, i) => {
              const isAnswered = !!answers[q.questionId];
              const isCurrent = i === index;
              let bubbleClass = 'q-bubble';
              if (isAnswered) bubbleClass += ' answered';
              if (isCurrent) bubbleClass += ' current';

              return (
                <div 
                  key={q.questionId} 
                  className={bubbleClass}
                  onClick={() => jumpToQuestion(i)}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>

          <div className="sidebar-footer">
            <div className="legend-item"><div className="dot green"></div> Answered</div>
            <div className="legend-item"><div className="dot gray"></div> Not Answered</div>
          </div>
        </div>

        <div className="test-main">
          
          <div className="test-header">
            <div className="test-info">
              <h3>Technical Assessment</h3>
              <span>Question {index + 1} of {questions.length}</span>
            </div>
            <div className={`timer-box ${timeLeft < ALERT_TIME ? 'warning' : ''}`}>
              ⏱ {formatTime(timeLeft)}
            </div>
          </div>

          <div className="question-area">
            <div className="question-text" dangerouslySetInnerHTML={{ __html: currentQ.questionText }} />
            
            <div className="options-list">
              {['A', 'B', 'C', 'D', 'E'].map((optKey) => {
                let optText = currentQ['option' + optKey];

                // Default text for option E
                if (optKey === 'E') {
                  optText = optText || "I am not sure about the answer.";
                }

                if (!optText) return null;

                const isSelected = answers[currentQ.questionId] === optKey;

                return (
                  <div 
                    key={optKey} 
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleOptionSelect(optKey)}
                  >
                    <div className="radio-circle"></div>
                    <div className="option-text">
                      <span style={{fontWeight:700, marginRight:8}}>{optKey}.</span> 
                      {optText}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="test-footer">
            <button 
              className="btn-nav btn-prev" 
              onClick={goToPrev} 
              disabled={index === 0}
            >
              Previous
            </button>
            
            {isLast ? (
              <button className="btn-nav btn-finish" onClick={() => finishTest(false)}>
                Submit Test
              </button>
            ) : (
              <button className="btn-nav btn-next" onClick={goToNext}>
                Next Question
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
    </>
  );
}