import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

ChartJS.register(
  CategoryScale,
  LinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const ThankYouPage = () => {
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const chartRef = useRef(null);

  useEffect(() => {
    handleViewReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleViewReport = async () => {
    setError(null);
    setReport(null); // ensures overlay + wait message show from the start

    try {
      const assistantId = localStorage.getItem("assistantId");
      const resumeId = localStorage.getItem("resumeId");
      const bearerToken = import.meta.env.VITE_PRIVATE_API_KEY;

      if (!assistantId || !resumeId) {
        setError("Missing assistantId or resumeId");
        return;
      }

      const storedCallId = localStorage.getItem("callId");

      const endedCallId = await waitForEndedCall({
        assistantId,
        bearerToken,
        targetCallId: storedCallId || null,
        timeoutMs: 120000,
        intervalMs: 3000,
      });

      const reportRes = await axios.post(
        `https://firstmerdian.tjdem.online/api/interviews/fetch/${endedCallId}/`,
        { resume_id: resumeId },
        { headers: { Authorization: `Bearer ${bearerToken}` } }
      );

      if (!reportRes?.data?.report) {
        throw new Error("Report not available in response");
      }

      // ✅ Only now do we remove overlay by setting the report
      setReport(reportRes.data.report);
    } catch (e) {
      console.error(e);
      setError(e?.message || "There was an error processing the interview report.");
    }
  };

  const handleDownloadPDF = () => {
    if (!report) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Interview Report", 14, 20);
    doc.setFontSize(12);

    autoTable(doc, {
      startY: 30,
      head: [["Candidate Name", "Position", "Overall Score"]],
      body: [[report.candidate_name, report.position, report.overall_score]],
    });

    if (report.overall_strengths?.length) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [["Overall Strengths"]],
        body: report.overall_strengths.map((s) => [s]),
      });
    }

    if (report.overall_improvements?.length) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [["Overall Improvements"]],
        body: report.overall_improvements.map((imp) => [imp]),
      });
    }

    if (report.recommendations?.length) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [["Recommendations"]],
        body: report.recommendations.map((r) => [r]),
      });
    }

    if (chartRef.current) {
      const chartImage = chartRef.current.toBase64Image();
      doc.addPage();
      doc.text("Skills Chart", 14, 20);
      doc.addImage(chartImage, "PNG", 15, 30, 180, 160);
    }

    doc.save(`${report.candidate_name}_InterviewReport.pdf`);
  };

  const Spinner = ({ className = "" }) => (
    <svg
      className={`animate-spin h-10 w-10 text-[#00adb5] ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );

  const skillChartData = {
    labels: report?.scores_per_skill?.map((s) => s.skill) || [],
    datasets: [
      {
        label: "Skill Scores",
        data: report?.scores_per_skill?.map((s) => s.score) || [],
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const skillChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      datalabels: {
        formatter: (value, ctx) => {
          const total = ctx.chart.data.datasets[0].data.reduce(
            (sum, val) => sum + (Number(val) || 0),
            0
          );
          if (!total) return "0%";
          const percentage = ((value / total) * 100).toFixed(1) + "%";
          return percentage;
        },
        color: "#fff",
        font: { weight: "bold", size: 12 },
      },
      tooltip: { enabled: true },
      title: { display: false },
    },
    maintainAspectRatio: false,
  };

  // ---------- Helper: poll Vapi until ENDED call ----------
  async function waitForEndedCall({
    assistantId,
    bearerToken,
    targetCallId = null,
    timeoutMs = 120000,
    intervalMs = 3000,
  }) {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const res = await fetch(
        `https://api.vapi.ai/call?assistantId=${assistantId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${bearerToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) throw new Error(`Vapi /call failed with ${res.status}`);

      const calls = await res.json();
      if (Array.isArray(calls) && calls.length) {
        let candidate = null;

        if (targetCallId) {
          candidate = calls.find((c) => c.id === targetCallId);
        } else {
          const ended = calls
            .filter((c) => c.status === "ended" || c.endedAt)
            .sort(
              (a, b) =>
                new Date(b.updatedAt || b.endedAt || b.createdAt) -
                new Date(a.updatedAt || a.endedAt || a.createdAt)
            );
          if (ended.length) candidate = ended[0];
        }

        if (candidate && (candidate.status === "ended" || candidate.endedAt)) {
          return candidate.id;
        }
      }

      await new Promise((r) => setTimeout(r, intervalMs));
    }

    throw new Error("Timed out waiting for call to end");
  }

  // -------- UI Logic --------
  // 🔒 Overlay shows as long as there is NO report and NO error
  const showOverlay = !report && !error;

  return (
    <div className="relative min-h-screen bg-gray-100 flex items-center justify-center">
      {/* Full-screen Loader Overlay (stays until report is set) */}
      {showOverlay && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm"
          aria-busy="true"
          aria-live="polite"
        >
          <Spinner />
          <p className="mt-4 text-lg font-medium text-gray-800">
            Generating your interview report…
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Analyzing answers, scoring skills, and compiling insights
          </p>
        </div>
      )}

      <div className="text-center px-8 py-6 w-full max-w-5xl">
        <h1 className="text-4xl font-extrabold text-black">
          Your Interview is Complete!
        </h1>

        {/* 📣 Message under the title until report is generated */}
        {!report && !error && (
          <p className="mt-3 text-base text-gray-700">
            Please wait until the report is generated.
          </p>
        )}

        {error && (
          <div className="mt-4 text-red-700 bg-red-100 border border-red-300 rounded p-3 inline-block">
            {error}
          </div>
        )}

        {/* Report */}
        {report && !error && (
          <div className="mt-6 border rounded-lg shadow-lg bg-white p-6 text-left">
            <h2 className="text-xl font-bold text-black mb-4">
              Interview Report
            </h2>

            <table className="min-w-full text-black border mb-6">
              <thead>
                <tr>
                  <th className="py-2 px-4 border">Candidate Name</th>
                  <th className="py-2 px-4 border">Position</th>
                  <th className="py-2 px-4 border">Overall Score</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 px-4 border">
                    {report.candidate_name}
                  </td>
                  <td className="py-2 px-4 border">{report.position}</td>
                  <td className="py-2 px-4 border">{report.overall_score}</td>
                </tr>
              </tbody>
            </table>

            <h3 className="font-semibold text-lg text-black">
              Overall Strengths:
            </h3>
            <ul className="mb-4 list-disc ml-6">
              {report.overall_strengths?.length > 0 ? (
                report.overall_strengths.map((s, i) => (
                  <li key={i} className="text-black">
                    {s}
                  </li>
                ))
              ) : (
                <p className="text-black">No strengths mentioned.</p>
              )}
            </ul>

            <h3 className="font-semibold text-lg text-black">
              Overall Improvements:
            </h3>
            <ul className="mb-4 list-disc ml-6">
              {report.overall_improvements?.length > 0 ? (
                report.overall_improvements.map((imp, i) => (
                  <li key={i} className="text-black">
                    {imp}
                  </li>
                ))
              ) : (
                <p className="text-black">No improvements mentioned.</p>
              )}
            </ul>

            <h3 className="font-semibold text-lg text-black">
              Recommendations:
            </h3>
            <ul className="mb-6 list-disc ml-6">
              {report.recommendations?.length > 0 ? (
                report.recommendations.map((r, i) => (
                  <li key={i} className="text-black">
                    {r}
                  </li>
                ))
              ) : (
                <p className="text-black">No recommendations available.</p>
              )}
            </ul>

            <div className="flex justify-center mb-6">
              <div style={{ width: "300px", height: "300px" }}>
                <Doughnut
                  ref={chartRef}
                  data={skillChartData}
                  options={skillChartOptions}
                />
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={handleDownloadPDF}
                className="px-6 py-3 bg-[#00adb5] text-white rounded-lg hover:bg-[#009ba2]"
              >
                Download PDF
              </button>
            </div>
          </div>
        )}

        {/* Retry button if error */}
        {error && (
          <div className="mt-6">
            <button
              onClick={handleViewReport}
              className="px-6 py-3 bg-[#00adb5] text-white rounded-lg hover:bg-[#009ba2]"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThankYouPage;
