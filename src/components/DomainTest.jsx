import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { post } from '../api';          // ✅ use your real API
import '../styles/test.css';           // ✅ reuse the same CSS

const ALERT_TIME = 5 * 60; // 5 minutes warning

export default function DomainTest({ studentId }) {
  const nav = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 45 mins
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const timerRef = useRef(null);

  // -------- 1. FETCH QUESTIONS ----------
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const r = await post('getDomainQuestions', { studentId });

        if (r.status === 'ok' && Array.isArray(r.questions) && r.questions.length > 0) {
          setQuestions(r.questions.slice(0, 25));
        } else if (r.message && r.message.includes('No domain selected')) {
          setErrorMsg('Domain role not selected. Please return to the Role Selection page.');
          setQuestions([]);
        } else {
          setErrorMsg(
            r.message ||
            'No domain questions found for your selected role. Please verify QuestionBank data.'
          );
          setQuestions([]);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Network error loading questions. Ensure Apps Script is deployed correctly.');
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId, nav]);

  // -------- 2. TIMER ----------
  useEffect(() => {
    if (questions.length > 0 && !loading) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            finishTest(true); // auto submit when time over
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [questions, loading]);

  // -------- 3. TAB SWITCH DETECTION ----------
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        alert(
          'Tab switch detected! Auto-submitting your test with the answers you have marked so far.'
        );
        finishTest(true, true); // auto = true, violation = true
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [answers]);

  // -------- HELPERS ----------
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
      setIndex((prev) => prev + 1);
    } else {
      finishTest(false);
    }
  };

  const goToPrev = () => {
    if (index > 0) setIndex((prev) => prev - 1);
  };

  const jumpToQuestion = (i) => setIndex(i);

  // -------- 4. SUBMIT FUNCTION ----------
  const finishTest = async (auto = false, violation = false) => {
    clearInterval(timerRef.current);

    // Confirmation only for manual normal submit
    if (!auto && !violation && !window.confirm('Are you sure you want to submit your technical test?')) {
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
        violation, // send flag
      });

      if (r.status === 'ok') {
        if (violation) {
          alert('Your test has been auto-submitted successfully due to tab switching.');
        } else {
          alert('Technical Test submitted successfully!');
        }
        nav('/checklist');
      } else {
        alert(r.message || 'Submission failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error submitting test.');
    }
  };

  // -------- 5. RENDER FALLBACKS ----------
  if (loading) {
    return (
      <div className="test-container" style={{ alignItems: 'center' }}>
        Loading Technical Assessment...
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div
        className="test-container"
        style={{ alignItems: 'center', flexDirection: 'column', padding: '100px' }}
      >
        <h2 style={{ color: '#b91c1c' }}>Assessment Load Error</h2>
        <p style={{ color: '#6b7280', fontSize: '1.1rem', textAlign: 'center' }}>{errorMsg}</p>

        {errorMsg.includes('Domain role not selected') ? (
          <button
            onClick={() => nav('/select-role')}
            className="btn-save"
            style={{ marginTop: '20px' }}
          >
            Go to Role Selection
          </button>
        ) : (
          <button
            onClick={() => nav('/checklist')}
            className="btn-save"
            style={{ marginTop: '20px' }}
          >
            Go to Checklist
          </button>
        )}
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div
        className="test-container"
        style={{ alignItems: 'center', flexDirection: 'column', padding: '100px' }}
      >
        <h2 style={{ color: '#1a73e8' }}>Assessment Not Available</h2>
        <p style={{ color: '#6b7280', fontSize: '1.1rem', textAlign: 'center' }}>
          No questions were found for your selected domain. Please check the sheet configuration.
        </p>
        <button
          onClick={() => nav('/checklist')}
          className="btn-save"
          style={{ marginTop: '20px' }}
        >
          Go to Checklist
        </button>
      </div>
    );
  }

  // -------- 6. MAIN RENDER ----------
  const currentQ = questions[index];
  const isLast = index === questions.length - 1;

  return (
    <div className="test-container">
      <div className="test-wrapper">
        {/* Sidebar */}
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
            <div className="legend-item">
              <div className="dot green" /> Answered
            </div>
            <div className="legend-item">
              <div className="dot gray" /> Not Answered
            </div>
          </div>
        </div>

        {/* Main Area */}
        <div className="test-main">
          <div className="test-header">
            <div className="test-info">
              <h3>Technical Assessment</h3>
              <span>
                Question {index + 1} of {questions.length}
              </span>
            </div>
            <div className={`timer-box ${timeLeft < ALERT_TIME ? 'warning' : ''}`}>
              ⏱ {formatTime(timeLeft)}
            </div>
          </div>

          <div className="question-area">
            <div
              className="question-text"
              dangerouslySetInnerHTML={{ __html: currentQ.questionText }}
            />

            <div className="options-list">
              {['A', 'B', 'C', 'D', 'E'].map((optKey) => {
                let optText = currentQ['option' + optKey];

                if (optKey === 'E') {
                  optText = optText || 'I am not sure about the answer.';
                }

                if (!optText) return null;

                const isSelected = answers[currentQ.questionId] === optKey;

                return (
                  <div
                    key={optKey}
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleOptionSelect(optKey)}
                  >
                    <div className="radio-circle" />
                    <div className="option-text">
                      <span style={{ fontWeight: 700, marginRight: 8 }}>{optKey}.</span>
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
