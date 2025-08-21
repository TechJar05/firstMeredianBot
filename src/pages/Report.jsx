import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const InterviewReport = () => {
  const { id } = useParams();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const resumeId = id || localStorage.getItem("resumeId");
        if (!resumeId) {
          setError("No resume ID found.");
          setLoading(false);
          return;
        }
        const response = await axios.get(
          `https://firstmerdian.tjdem.online/api/interview-report-data/${resumeId}/`
        );
        setReportData(response.data);
      } catch (err) {
        console.error("Error fetching report:", err);
        setError("Failed to load report data.");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  // Enhanced PDF generation with better error handling
  const downloadPDF = async () => {
    if (!reportRef.current) {
      alert("Report content not found. Please try again.");
      return;
    }

    setIsGeneratingPDF(true);
    
    try {
      // Improved html2canvas options
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: reportRef.current.scrollWidth,
        height: reportRef.current.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // 10mm margin
      const contentWidth = pdfWidth - (margin * 2);

      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * contentWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, "PNG", margin, margin, contentWidth, imgHeight);
      heightLeft -= (pdfHeight - margin * 2);

      // Add extra pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, position + margin, contentWidth, imgHeight);
        heightLeft -= (pdfHeight - margin * 2);
      }

      pdf.save(`Interview_Report_${candidate_name || 'Candidate'}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading report...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
        <p className="text-red-700">{error}</p>
      </div>
    </div>
  );
  
  if (!reportData) return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-gray-600">No report data available.</p>
    </div>
  );

  const {
    candidate_name,
    job_title,
    organization_name,
    report = {}
  } = reportData;

  const {
    position,
    overall_score,
    recommendations = [],
    scores_per_skill = [],
    overall_strengths = [],
    overall_improvements = []
  } = report;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* PDF Download Button - Top
        <div className="text-center mb-6">
          <button
            onClick={downloadPDF}
            disabled={isGeneratingPDF}
            className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              isGeneratingPDF
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 transform hover:scale-105"
            } text-white shadow-lg hover:shadow-xl`}
          >
            {isGeneratingPDF ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating PDF...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF Report
              </>
            )}
          </button>
        </div> */}

        {/* Report Card */}
        <div
          ref={reportRef}
          className="bg-white shadow-2xl rounded-2xl border-2 border-gray-200 overflow-hidden"
        >
          {/* Header Section */}
          <div className="bg-[#00adb5] text-white p-8">
            <h1 className="text-4xl font-bold text-center mb-2">
              Interview Assessment Report
            </h1>
            <div className="w-24 h-1 bg-white mx-auto rounded-full"></div>
          </div>

          <div className="p-8">
            {/* Candidate Information Card */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Candidate Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <span className="font-semibold text-gray-600">Candidate Name:</span>
                  <p className="text-lg font-medium text-gray-800 mt-1">{candidate_name}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <span className="font-semibold text-gray-600">Position:</span>
                  <p className="text-lg font-medium text-gray-800 mt-1">{position || job_title}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <span className="font-semibold text-gray-600">Organization:</span>
                  <p className="text-lg font-medium text-gray-800 mt-1">{organization_name}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <span className="font-semibold text-gray-600">Overall Score:</span>
                  <div className="flex items-center mt-1">
                    <p className="text-2xl font-bold text-[#00adb5] mr-2">
                      {overall_score || "N/A"}
                    </p>
                    <span className="text-gray-500">/10</span>
                    {overall_score && (
                      <div className="ml-4 flex-1 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-[#00adb5] h-3 rounded-full transition-all duration-500"
                          style={{ width: `${(overall_score / 10) * 100}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Key Strengths Section */}
            <section className="mb-8">
              <div className="border-2 border-green-200 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 p-6">
                <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Key Strengths
                </h2>
                {overall_strengths.length > 0 ? (
                  <div className="space-y-3">
                    {overall_strengths.map((strength, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-lg border-l-4 border-green-500 shadow-sm">
                        <p className="text-gray-700">{strength}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-500 italic">No strengths data available.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Areas for Improvement Section */}
            <section className="mb-8">
              <div className="border-2 border-orange-200 rounded-xl bg-gradient-to-r from-orange-50 to-yellow-50 p-6">
                <h2 className="text-2xl font-bold text-orange-800 mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Areas for Improvement
                </h2>
                {overall_improvements.length > 0 ? (
                  <div className="space-y-3">
                    {overall_improvements.map((improvement, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-lg border-l-4 border-orange-500 shadow-sm">
                        <p className="text-gray-700">{improvement}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-500 italic">No improvement areas identified.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Skill Scores Section */}
            <section className="mb-8">
              <div className="border-2 border-purple-200 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 p-6">
                <h2 className="text-2xl font-bold text-purple-800 mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Detailed Skill Assessment
                </h2>
                {scores_per_skill.length > 0 ? (
                  <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                              Skill
                            </th>
                            <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                              Score
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                              Strength
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                              Improvement
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {scores_per_skill.map((skill, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 font-medium text-gray-900">
                                {skill.skill}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center">
                                  <span className="text-xl font-bold text-[#6e11b0] mr-2">
                                    {skill.score}
                                  </span>
                                  <span className="text-gray-500">/10</span>
                                </div>
                                <div className="mt-2 w-20 bg-gray-200 rounded-full h-2 mx-auto">
                                  <div
                                    className="bg-[#6e11b0] h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${(skill.score / 10) * 100}%` }}
                                  ></div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-gray-700">
                                <div className="max-w-xs">
                                  {skill.strength}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-gray-700">
                                <div className="max-w-xs">
                                  {skill.improvement}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
                    <p className="text-gray-500 italic">No skill scores available.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Recommendations Section */}
            <section className="mb-6">
              <div className="border-2 border-blue-200 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 p-6">
                <h2 className="text-2xl font-bold text-[blue-800] mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Recommendations
                </h2>
                {recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {recommendations.map((recommendation, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-lg border-l-4 border-blue-500 shadow-sm">
                        <p className="text-gray-700">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-500 italic">No specific recommendations available.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Footer */}
            <div className="text-center pt-6 border-t-2 border-gray-200">
              <p className="text-gray-500 text-sm">
                Report generated on {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom PDF Download Button
        <div className="text-center mt-8">
          <button
            onClick={downloadPDF}
            disabled={isGeneratingPDF}
            className={`inline-flex items-center px-8 py-4 rounded-lg font-medium text-lg transition-all duration-200 ${
              isGeneratingPDF
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gray-800 hover:bg-gray-900 transform hover:scale-105"
            } text-white shadow-lg hover:shadow-xl`}
          >
            {isGeneratingPDF ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Generating PDF...
              </>
            ) : (
              <>
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF Report
              </>
            )}
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default InterviewReport;