import React, { useEffect, useState } from "react";
import axios from "axios";

const InterviewReport = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        // ✅ Get resume_id from localStorage
        const resumeId = localStorage.getItem("resumeId");
        if (!resumeId) {
          setError("No resume ID found in local storage.");
          setLoading(false);
          return;
        }

        // ✅ API Call
        const response = await axios.get(
          `http://10.110.59.99:8000/api/interview/report/${resumeId}/`
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
  }, []);

  if (loading) return <p>Loading report...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!reportData) return <p>No report data available.</p>;

  const {
    summary,
    strengths = [],
    improvements = [],
    overall_recommendation,
    justification = [],
    scores = {},
    avg_rating,
  } = reportData;

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "20px",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      {/* Interview Summary */}
      <h2>Interview Summary</h2>
      <p>{summary}</p>
      <p>
        <strong>Average Rating:</strong>{" "}
        {avg_rating ? `${avg_rating}/10` : "N/A"}
      </p>

      {/* Key Strengths */}
      <h2>Key Strengths</h2>
      {strengths.length > 0 ? (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "20px",
          }}
        >
          <thead>
            <tr>
              <th style={{ border: "1px solid #000", padding: "8px" }}>
                Aspect
              </th>
              <th style={{ border: "1px solid #000", padding: "8px" }}>
                Evidence from Responses
              </th>
            </tr>
          </thead>
          <tbody>
            {strengths.map((s, idx) => (
              <tr key={idx}>
                <td style={{ border: "1px solid #000", padding: "8px" }}>
                  {s.aspect}
                </td>
                <td style={{ border: "1px solid #000", padding: "8px" }}>
                  {s.evidence}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No strengths data available.</p>
      )}

      {/* Areas for Improvement */}
      <h2>Areas for Improvement</h2>
      {improvements.length > 0 ? (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "20px",
          }}
        >
          <thead>
            <tr>
              <th style={{ border: "1px solid #000", padding: "8px" }}>
                Aspect to Improve
              </th>
              <th style={{ border: "1px solid #000", padding: "8px" }}>
                Suggestion or Evidence
              </th>
            </tr>
          </thead>
          <tbody>
            {improvements.map((imp, idx) => (
              <tr key={idx}>
                <td style={{ border: "1px solid #000", padding: "8px" }}>
                  {imp.aspect}
                </td>
                <td style={{ border: "1px solid #000", padding: "8px" }}>
                  {imp.suggestion}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No improvements data available.</p>
      )}

      {/* Skill Distribution */}
      <h2>Skill Distribution</h2>
      <div style={{ maxWidth: "400px", margin: "20px auto" }}>
        <SkillBar
          label="Technical"
          value={scores.technical || 0}
          color="#4CAF50"
        />
        <SkillBar
          label="Communication"
          value={scores.communication || 0}
          color="#2196F3"
        />
        <SkillBar
          label="Behavioral"
          value={scores.behavioral || 0}
          color="#FFC107"
        />
      </div>

      {/* Overall Recommendation */}
      <h2>Overall Recommendation</h2>
      <p>
        <strong>Status:</strong> {overall_recommendation}
      </p>
      <ul>
        {justification.map((j, idx) => (
          <li key={idx}>{j}</li>
        ))}
      </ul>
    </div>
  );
};

// ✅ Skill Bar Subcomponent
const SkillBar = ({ label, value, color }) => {
  const percentage = Math.min(Math.max(value, 0), 10) * 10; // convert score (0–10) → %
  return (
    <div style={{ marginBottom: "15px" }}>
      <span
        style={{
          display: "inline-block",
          width: "120px",
          fontWeight: "bold",
        }}
      >
        {label}
      </span>
      <div
        style={{
          display: "inline-block",
          width: "200px",
          backgroundColor: "#e0e0e0",
          borderRadius: "5px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            height: "20px",
          }}
        ></div>
      </div>
      <span style={{ marginLeft: "10px" }}>{percentage.toFixed(1)}%</span>
    </div>
  );
};

export default InterviewReport;
