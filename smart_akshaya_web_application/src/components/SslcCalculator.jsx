import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Award, Share2, Download, AlertTriangle, CheckCircle, Plus, Minus, Calculator } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Grade Point Configuration
const GRADES_CONFIG = [
  { grade: 'A+', points: 9, label: 'Outstanding (90-100%)', color: '#10b981' },
  { grade: 'A', points: 8, label: 'Excellent (80-89%)', color: '#059669' },
  { grade: 'B+', points: 7, label: 'Very Good (70-79%)', color: '#3b82f6' },
  { grade: 'B', points: 6, label: 'Good (60-69%)', color: '#2563eb' },
  { grade: 'C+', points: 5, label: 'Above Average (50-59%)', color: '#f59e0b' },
  { grade: 'C', points: 4, label: 'Average (40-49%)', color: '#d97706' },
  { grade: 'D+', points: 3, label: 'Marginal (30-39%)', color: '#ec4899' },
  { grade: 'D', points: 2, label: 'Need Improvement (20-29%)', color: '#f43f5e' },
  { grade: 'E', points: 1, label: 'Need Improvement (<20%)', color: '#e11d48' }
];

export default function SslcCalculator({ onViewChange }) {
  // Initialize counts for each grade to 0
  const [counts, setCounts] = useState(
    GRADES_CONFIG.reduce((acc, g) => ({ ...acc, [g.grade]: 0 }), {})
  );

  const [totalSubjects, setTotalSubjects] = useState(0);
  const [tgp, setTgp] = useState(0); // Total Grade Points
  const [percentage, setPercentage] = useState(null);
  const [classification, setClassification] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Recalculate total subjects when counts change
  useEffect(() => {
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    setTotalSubjects(total);

    // Calculate TGP
    const points = GRADES_CONFIG.reduce((sum, g) => sum + (counts[g.grade] * g.points), 0);
    setTgp(points);

    // Clear percentage if total subjects changed from 10
    if (total !== 10) {
      setPercentage(null);
      setErrorMsg(`Total subjects: ${total} / 10. Select exactly 10 subjects.`);
    } else {
      setErrorMsg('');
    }
  }, [counts]);

  // Adjust count for a grade
  const adjustCount = (grade, delta) => {
    setCounts(prev => {
      const current = prev[grade] || 0;
      const next = Math.max(0, current + delta);

      // Prevent going over 10 subjects in total
      const totalWithoutCurrent = Object.entries(prev)
        .filter(([k]) => k !== grade)
        .reduce((sum, [, v]) => sum + v, 0);

      if (totalWithoutCurrent + next > 10) {
        return prev; // Do nothing if it exceeds 10
      }

      return { ...prev, [grade]: next };
    });
  };

  // Direct input field change
  const handleInputChange = (grade, value) => {
    const num = Math.max(0, parseInt(value) || 0);
    setCounts(prev => {
      const totalWithoutCurrent = Object.entries(prev)
        .filter(([k]) => k !== grade)
        .reduce((sum, [, v]) => sum + v, 0);

      const allowed = Math.min(num, 10 - totalWithoutCurrent);
      return { ...prev, [grade]: allowed };
    });
  };

  // Perform calculation
  const calculateResult = () => {
    if (totalSubjects !== 10) {
      setErrorMsg(`Cannot calculate. You have selected ${totalSubjects} subjects instead of 10.`);
      return;
    }

    // Kerala SSLC formula: Percentage = (TGP / 90) * 100 = TGP / 0.9
    const calculatedPercent = parseFloat(((tgp / 90) * 100).toFixed(2));
    setPercentage(calculatedPercent);

    // Determine Classification
    let classLabel = 'Passed';
    if (counts['A+'] === 10) {
      classLabel = '🌟 Full A+ (Outstanding Distinction) 🌟';
    } else if (calculatedPercent >= 90) {
      classLabel = 'First Class with Distinction (Outstanding)';
    } else if (calculatedPercent >= 80) {
      classLabel = 'First Class with Distinction';
    } else if (calculatedPercent >= 70) {
      classLabel = 'First Class';
    } else if (calculatedPercent >= 50) {
      classLabel = 'Second Class';
    } else if (calculatedPercent >= 35) {
      classLabel = 'Third Class';
    } else {
      classLabel = 'Needs Improvement';
    }
    setClassification(classLabel);
  };

  // Reset all fields
  const handleReset = () => {
    setCounts(GRADES_CONFIG.reduce((acc, g) => ({ ...acc, [g.grade]: 0 }), {}));
    setPercentage(null);
    setClassification('');
  };

  // Share to WhatsApp
  const shareToWhatsapp = () => {
    if (percentage === null) return;

    let msg = `*Kerala SSLC Result Estimator*\n\n`;
    msg += `📊 *Estimated Percentage:* ${percentage}%\n`;
    msg += `📈 *Total Grade Points (TGP):* ${tgp} / 90\n`;
    msg += `🏆 *Classification:* ${classification}\n\n`;
    msg += `*Grade Breakdown:*\n`;

    GRADES_CONFIG.forEach(g => {
      if (counts[g.grade] > 0) {
        msg += `- ${g.grade}: ${counts[g.grade]} Subject(s)\n`;
      }
    });

    msg += `\nCalculated via *Smart Akshaya*`;

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Generate and Download PDF Report
  const downloadReportPdf = async () => {
    if (percentage === null) return;
    setIsGeneratingPdf(true);

    const reportElement = document.getElementById('sslc-report-card');
    if (!reportElement) {
      setIsGeneratingPdf(false);
      return;
    }

    try {
      // Temporarily show full report card without scroll or hidden tags
      reportElement.style.display = 'block';

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 Width in mm
      const pageHeight = 295; // A4 Height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Kerala_SSLC_Report_${tgp}TGP.pdf`);
    } catch (error) {
      console.error('PDF Generation failed:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '30px 20px',
      color: 'var(--text-primary)',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      {/* ── Top Header Bar ── */}


      {/* ── Main Dashboard Layout ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: percentage !== null ? '1fr 400px' : '1fr',
        gap: '30px',
        transition: 'all 0.3s ease'
      }}>

        {/* Left Side: Input Grid & Controls */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              Kerala SSLC Grade Calculator
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
              Input your grades for all 10 subjects to compute your estimated percentage and total points
            </p>
          </div>

          {/* Validation Alert Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 18px',
            borderRadius: '10px',
            marginBottom: '24px',
            backgroundColor: totalSubjects === 10 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${totalSubjects === 10 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: totalSubjects === 10 ? '#10b981' : '#f43f5e',
            fontSize: '13.5px',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}>
            {totalSubjects === 10 ? (
              <>
                <CheckCircle size={18} />
                <span>Perfect! All 10 subjects selected. Ready to calculate.</span>
              </>
            ) : (
              <>
                <AlertTriangle size={18} />
                <span>Total Subjects Selected: {totalSubjects} / 10. {totalSubjects < 10 ? `Need ${10 - totalSubjects} more.` : `Remove ${totalSubjects - 10} subject(s).`}</span>
              </>
            )}
          </div>

          {/* Grades Card Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '28px'
          }}>
            {GRADES_CONFIG.map(g => {
              const currentVal = counts[g.grade] || 0;
              return (
                <div
                  key={g.grade}
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    border: currentVal > 0 ? `2.5px solid ${g.color}` : '1.5px solid var(--border)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.15s ease',
                    boxShadow: currentVal > 0 ? `0 4px 12px ${g.color}15` : 'none'
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: currentVal > 0 ? g.color : 'var(--text-primary)' }}>
                      {g.grade}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: '600', marginTop: '2px' }}>
                      {g.points} Grade Points
                    </div>
                  </div>

                  {/* Counter Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
                    <button
                      onClick={() => adjustCount(g.grade, -1)}
                      disabled={currentVal === 0}
                      style={{
                        flex: 1,
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-secondary)',
                        cursor: currentVal === 0 ? 'not-allowed' : 'pointer',
                        opacity: currentVal === 0 ? 0.4 : 1,
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => { if (currentVal > 0) e.currentTarget.style.borderColor = 'var(--primary)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                      <Minus size={13} />
                    </button>

                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={currentVal}
                      onChange={(e) => handleInputChange(g.grade, e.target.value)}
                      style={{
                        width: '45px',
                        height: '32px',
                        textAlign: 'center',
                        fontSize: '14px',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        outline: 'none',
                        MozAppearance: 'textfield'
                      }}
                    />

                    <button
                      onClick={() => adjustCount(g.grade, 1)}
                      disabled={totalSubjects >= 10}
                      style={{
                        flex: 1,
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-secondary)',
                        cursor: totalSubjects >= 10 ? 'not-allowed' : 'pointer',
                        opacity: totalSubjects >= 10 ? 0.4 : 1,
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => { if (totalSubjects < 10) e.currentTarget.style.borderColor = 'var(--primary)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={calculateResult}
              disabled={totalSubjects !== 10}
              style={{
                flex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                height: '48px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: totalSubjects === 10 ? 'var(--primary)' : 'var(--border)',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: '700',
                cursor: totalSubjects === 10 ? 'pointer' : 'not-allowed',
                boxShadow: totalSubjects === 10 ? 'var(--shadow-glow)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              Calculate Percentage
            </button>

            <button
              onClick={handleReset}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                height: '48px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#f43f5e';
                e.currentTarget.style.color = '#f43f5e';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <RefreshCw size={15} />
              Reset
            </button>
          </div>

          {/* Disclaimer text */}
          <p style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: '20px',
            lineHeight: '1.4'
          }}>
            <strong>Note:</strong> This estimation is based on Grade Points (A+ = 9 to E = 1). The maximum grade points achievable is 90. The official certificate marks and grades may vary slightly.
          </p>

        </div>

        {/* Right Side: Calculated Result Dashboard */}
        {percentage !== null && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            animation: 'fadeIn 0.3s ease-out'
          }}>

            {/* Visual Circular Gauge / Percentage Card */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: 'var(--shadow-md)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px'
            }}>
              <span style={{ fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.8px' }}>
                Estimated Percentage
              </span>

              {/* Radial Progress Ring */}
              <div style={{ position: 'relative', width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="150" height="150" viewBox="0 0 150 150">
                  <circle cx="75" cy="75" r="65" fill="none" stroke="var(--border)" strokeWidth="10" />
                  <circle cx="75" cy="75" r="65" fill="none" stroke="var(--primary)" strokeWidth="10"
                    strokeDasharray={408.4}
                    strokeDashoffset={408.4 - (408.4 * percentage) / 100}
                    strokeLinecap="round"
                    transform="rotate(-90 75 75)"
                    style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                  />
                </svg>
                <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-primary)' }}>
                    {percentage}%
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', marginTop: '2px' }}>
                    TGP: {tgp} / 90
                  </span>
                </div>
              </div>


            </div>



          </div>
        )}

      </div>

      {/* ── PDF Hidden Report Structure for html2canvas/jsPDF ── */}
      <div style={{ display: 'none' }}>
        <div
          id="sslc-report-card"
          style={{
            width: '800px',
            padding: '50px',
            backgroundColor: '#ffffff',
            color: '#1e293b',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #10b981', paddingBottom: '20px', marginBottom: '30px' }}>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: '0 0 4px 0' }}>
                KERALA SSLC RESULT ESTIMATOR
              </h1>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: '500' }}>
                SMART AKSHAYA E-CENTRE REPORT CARD
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                DATE GENERATED
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}
              </div>
            </div>
          </div>

          {/* Results Summary block */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '35px' }}>
            <div style={{ flex: 1, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ESTIMATED PERCENTAGE
              </div>
              <div style={{ fontSize: '48px', fontWeight: '900', color: '#10b981', margin: '8px 0' }}>
                {percentage}%
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                Based on 10 subjects calculation
              </div>
            </div>

            <div style={{ flex: 1, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                TOTAL GRADE POINTS (TGP)
              </div>
              <div style={{ fontSize: '48px', fontWeight: '900', color: '#2563eb', margin: '8px 0' }}>
                {tgp} / 90
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                Classification: {classification}
              </div>
            </div>
          </div>

          {/* Grade Breakdown Table */}
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
            GRADE DISTRIBUTION BREAKDOWN
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '35px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left', backgroundColor: '#f1f5f9' }}>
                <th style={{ padding: '10px 14px', fontSize: '13px', fontWeight: '700', color: '#334155' }}>GRADE</th>
                <th style={{ padding: '10px 14px', fontSize: '13px', fontWeight: '700', color: '#334155' }}>GRADE POINTS</th>
                <th style={{ padding: '10px 14px', fontSize: '13px', fontWeight: '700', color: '#334155' }}>DESCRIPTION</th>
                <th style={{ padding: '10px 14px', fontSize: '13px', fontWeight: '700', color: '#334155', textAlign: 'center' }}>COUNT</th>
                <th style={{ padding: '10px 14px', fontSize: '13px', fontWeight: '700', color: '#334155', textAlign: 'right' }}>TOTAL POINTS</th>
              </tr>
            </thead>
            <tbody>
              {GRADES_CONFIG.map(g => {
                const count = counts[g.grade] || 0;
                if (count === 0) return null;
                return (
                  <tr key={g.grade} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '13.5px' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '700', color: g.color }}>{g.grade}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{g.points}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{g.label}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '600' }}>{count}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                      {count * g.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer Info */}
          <div style={{
            borderTop: '1px solid #e2e8f0',
            paddingTop: '20px',
            textAlign: 'center',
            fontSize: '11px',
            color: '#64748b',
            lineHeight: '1.5'
          }}>
            <p style={{ margin: '0 0 6px 0', fontWeight: '600', color: '#475569' }}>
              Smart Akshaya E-Centre Pookiparamb
            </p>
            <p style={{ margin: 0 }}>
              Disclaimer: This report card provides an unofficial estimation of percentage based on grade points.
              The official marksheet and scoring issued by the Government of Kerala Board of Public Examinations remains the only authoritative document.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
