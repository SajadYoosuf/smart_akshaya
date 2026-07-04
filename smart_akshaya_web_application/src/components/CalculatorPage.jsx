import React, { useState, useCallback } from 'react';
import { Delete } from 'lucide-react';

const BTN_ROWS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '⌫', '='],
];

const OP_COLOR = 'var(--primary)';
const SPEC_COLOR = '#3b82f6';
const EQ_COLOR = 'var(--primary)';

export default function CalculatorPage() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [prevValue, setPrevValue] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState([]);

  const fmt = (n) => {
    if (isNaN(n) || !isFinite(n)) return 'Error';
    const s = String(n);
    if (s.length > 12) return parseFloat(n.toPrecision(10)).toString();
    return s;
  };

  const inputDigit = useCallback(
    (d) => {
      if (waitingForOperand) {
        setDisplay(String(d));
        setWaitingForOperand(false);
      } else {
        setDisplay(display === '0' ? String(d) : display + d);
      }
    },
    [display, waitingForOperand]
  );

  const inputDecimal = useCallback(() => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) setDisplay(display + '.');
  }, [display, waitingForOperand]);

  const toggleSign = useCallback(() => {
    setDisplay(fmt(parseFloat(display) * -1));
  }, [display]);

  const percent = useCallback(() => {
    setDisplay(fmt(parseFloat(display) / 100));
  }, [display]);

  const backspace = useCallback(() => {
    if (display.length === 1 || (display.length === 2 && display.startsWith('-'))) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  }, [display]);

  const clear = useCallback(() => {
    setDisplay('0');
    setExpression('');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  }, []);

  const handleOperator = useCallback(
    (op) => {
      const curr = parseFloat(display);
      if (prevValue !== null && operator && !waitingForOperand) {
        const result = calculate(prevValue, curr, operator);
        setDisplay(fmt(result));
        setPrevValue(result);
        setExpression(`${fmt(result)} ${op}`);
      } else {
        setPrevValue(curr);
        setExpression(`${display} ${op}`);
      }
      setOperator(op);
      setWaitingForOperand(true);
    },
    [display, prevValue, operator, waitingForOperand]
  );

  const calculate = (a, b, op) => {
    switch (op) {
      case '+': return a + b;
      case '−': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : NaN;
      default: return b;
    }
  };

  const equals = useCallback(() => {
    if (prevValue === null || !operator) return;
    const curr = parseFloat(display);
    const result = calculate(prevValue, curr, operator);
    const historyEntry = `${expression} ${display} = ${fmt(result)}`;
    setHistory((h) => [historyEntry, ...h].slice(0, 20));
    setDisplay(fmt(result));
    setExpression('');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  }, [display, prevValue, operator, expression]);

  const handleBtn = (btn) => {
    if (btn >= '0' && btn <= '9') return inputDigit(btn);
    switch (btn) {
      case '.': return inputDecimal();
      case 'C': return clear();
      case '±': return toggleSign();
      case '%': return percent();
      case '⌫': return backspace();
      case '=': return equals();
      case '+':
      case '−':
      case '×':
      case '÷': return handleOperator(btn);
      default: break;
    }
  };

  const getBtnColor = (btn) => {
    if (btn === '=') return EQ_COLOR;
    if (['+', '−', '×', '÷'].includes(btn)) return OP_COLOR;
    if (['C', '±', '%'].includes(btn)) return SPEC_COLOR;
    return 'rgba(255,255,255,0.07)';
  };

  const getBtnTextColor = (btn) => {
    if (['C', '±', '%', '+', '−', '×', '÷', '='].includes(btn)) return '#fff';
    return 'var(--text-primary)';
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', padding: '40px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
        borderRadius: '24px',
        padding: '32px 40px',
        color: 'white',
        boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)',
        marginBottom: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            Calculator
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px', marginTop: '8px' }}>
            Full-featured arithmetic calculator with history
          </div>
        </div>
        <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '20px' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line></svg>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 360px) 1fr',
          gap: 'clamp(16px, 5vw, 32px)',
          alignItems: 'start',
          maxWidth: '900px',
          width: '100%',
          boxSizing: 'border-box',
          padding: '0 16px'
        }}
      >
        {/* ── Calculator Body ── */}
        <div
          className="glow-card"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '32px', userSelect: 'none' }}
        >
          {/* Display */}
          <div
            style={{
              backgroundColor: 'rgba(0,0,0,0.35)',
              borderRadius: '10px',
              padding: '16px 20px',
              marginBottom: '20px',
              minHeight: '88px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
              gap: '4px',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', minHeight: '16px' }}>
              {expression}
            </div>
            <div
              style={{
                fontSize: display.length > 10 ? '22px' : '36px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                wordBreak: 'break-all',
                lineHeight: 1.2,
              }}
            >
              {display}
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {BTN_ROWS.flat().map((btn, idx) => (
              <button
                key={idx}
                onClick={() => handleBtn(btn)}
                style={{
                  gridColumn: btn === '0' ? 'span 2' : 'span 1',
                  backgroundColor: getBtnColor(btn),
                  color: getBtnTextColor(btn),
                  border: 'none',
                  borderRadius: '10px',
                  height: '58px',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'filter 0.1s ease, transform 0.1s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: btn === '0' ? 'flex-start' : 'center',
                  paddingLeft: btn === '0' ? '22px' : '0',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.2)')}
                onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'none')}
              >
                {btn === '⌫' ? <Delete size={18} /> : btn}
              </button>
            ))}
          </div>
        </div>

        {/* ── History Panel ── */}
        <div className="glow-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '32px' }}>
          <h3
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: 'var(--text-secondary)',
              marginBottom: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
            }}
          >
            History
          </h3>
          {history.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '13px',
                padding: '40px 0',
              }}
            >
              No calculations yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {history.map((h, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    fontFamily: 'monospace',
                  }}
                >
                  {h}
                </div>
              ))}
            </div>
          )}
          {history.length > 0 && (
            <button
              onClick={() => setHistory([])}
              style={{
                marginTop: '14px',
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-muted)',
                fontSize: '12px',
                padding: '6px 12px',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Clear History
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
