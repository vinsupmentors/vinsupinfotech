import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { post } from '../api';
import '../styles/test.css'; 

// ALERT_TIME is 5 minutes (300 seconds)
const ALERT_TIME = 300;

export default function DomainTest({ studentId }) {
  const nav = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(45 * 60); 
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null); // New state for backend errors
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

  const finishTest = async (auto = false) => {
    clearInterval(timerRef.current);
    if (!auto && !window.confirm("Are you sure you want to submit your technical test?")) {
        return; 
    }

    const payload = Object.keys(answers).map((qid) => ({
      questionId: qid,
      chosenOption: answers[qid],
    }));

    try {
      const r = await post('submitDomainResult', { studentId, answers: payload });
      if (r.status === 'ok') {
        alert('Technical Test submitted successfully!');
        nav('/checklist'); 
      } else {
        alert(r.message || 'Submission failed.');
      }
    } catch (err) {
      alert('Network error submitting test.');
    }
  };

  // --- RENDER FALLBACKS ---
  if (loading) return <div className="test-container" style={{alignItems:'center'}}>Loading Technical Assessment...</div>;
  if (errorMsg || !questions.length) return (
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
  );
  // --- END RENDER FALLBACKS ---


  // CRITICAL: Ensure currentQ exists before accessing properties
  const currentQ = questions[index];
  if (!currentQ) return null; 

  const isLast = index === questions.length - 1;

  return (
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
  );
}