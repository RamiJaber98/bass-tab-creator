import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./App.css";

const strings = ["G", "D", "A", "E"];
const frets = Array.from({ length: 25 }, (_, i) => i);
const noteNames = [
  ["G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G"],
  ["D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D"],
  ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A"],
  ["E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E"]
];

export default function BassTabCreator() {
  const [sequence, setSequence] = useState([]);
  const [showNotes, setShowNotes] = useState(false);
  const tabRef = useRef(null);

  const handleNoteSelect = (stringIndex, fret) => {
    const key = `${stringIndex}-${fret}`;
    setSequence((prev) => [...prev, { key, stringIndex, fret }]);
  };

  const handleKeyDown = (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      setSequence((prev) => [...prev, { key: "space", stringIndex: null, fret: null }]);
    } else if (e.code === "Backspace" || e.code === "Delete") {
      setSequence((prev) => prev.slice(0, -1));
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleExportImage = async () => {
    if (tabRef.current) {
      const canvas = await html2canvas(tabRef.current);
      const link = document.createElement("a");
      link.download = "bass-tab.png";
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const handleExportPDF = async () => {
    if (tabRef.current) {
      const canvas = await html2canvas(tabRef.current);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape" });
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, width, height);
      pdf.save("bass-tab.pdf");
    }
  };

  const handleClear = () => {
    setSequence([]);
  };

  const renderString = (stringName, stringIndex) => (
    <div className="string-row" key={stringName}>
      <div className="string-label">{stringName}</div>
      {frets.map((fret) => (
        <button
          key={`${stringIndex}-${fret}`}
          onClick={() => handleNoteSelect(stringIndex, fret)}
          className="fret-button"
        >
          {showNotes ? noteNames[stringIndex][fret] : fret}
        </button>
      ))}
    </div>
  );

  const renderTabOutput = () => {
    const chunks = [];
    const content = sequence.length === 0
      ? [Array(1).fill({ key: "space", stringIndex: null, fret: null })]
      : sequence.reduce((acc, curr, idx) => {
          if (idx % 50 === 0) acc.push([]);
          acc[acc.length - 1].push(curr);
          return acc;
        }, []);

    content.forEach(chunk => chunks.push(chunk));

    return chunks.map((chunk, chunkIndex) => {
      const tabLines = strings.map((s) => s + "|");
      chunk.forEach(({ stringIndex, fret }) => {
        for (let i = 0; i < tabLines.length; i++) {
          if (stringIndex === null) {
            tabLines[i] += "--";
          } else if (i === stringIndex) {
            tabLines[i] += `-${fret}`;
          } else {
            tabLines[i] += "--";
          }
        }
      });
      return (
        <div key={`chunk-${chunkIndex}`} className="tab-section">
          {tabLines.map((line, i) => <pre key={`${chunkIndex}-${i}`}>{line}</pre>)}
        </div>
      );
    });
  };

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">4-String Bass Tab Creator</h1>
        <div className="button-group">
          <label>
            <input
              type="checkbox"
              checked={showNotes}
              onChange={() => setShowNotes((prev) => !prev)}
            />
            Show Note Names
          </label>
          <button onClick={handleClear} className="export-button">Clear</button>
          <button onClick={handleExportImage} className="export-button">Export as PNG</button>
          <button onClick={handleExportPDF} className="export-button">Export as PDF</button>
        </div>
      </div>
      <div className="fretboard">
        {strings.map((s, i) => renderString(s, i))}
      </div>
      <div>
        <h2 className="subtitle">Generated Tab:</h2>
        <div className="tab-output" ref={tabRef}>
          {renderTabOutput()}
        </div>
      </div>
    </div>
  );
}
