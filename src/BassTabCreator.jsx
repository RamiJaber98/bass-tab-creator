import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./App.css";

const strings = ["G", "D", "A", "E"];
const frets = Array.from({ length: 25 }, (_, i) => i);
const MAX_NOTES_PER_LINE = 50;

const noteNames = [
  ["G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G"],
  ["D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D"],
  ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A"],
  ["E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E"]
];

export default function BassTabCreator() {
  const [sequence, setSequence] = useState([]);
  const [showNotes, setShowNotes] = useState(false);
  const [forceRenderLine, setForceRenderLine] = useState(0);
  const [labels, setLabels] = useState([]);
  const [showLabelInputs, setShowLabelInputs] = useState([]);
  const tabRef = useRef(null);

  const handleNoteSelect = (stringIndex, fret) => {
    const key = `${stringIndex}-${fret}`;
    setSequence((prev) => [...prev, { key, stringIndex, fret }]);
  };

  const handleKeyDown = (e) => {
    if (document.activeElement.tagName === 'INPUT') return;
    if (e.code === "Space") {
      e.preventDefault();
      setSequence((prev) => [...prev, { key: "space", stringIndex: null, fret: null }]);
    } else if (e.code === "Backspace" || e.code === "Delete") {
      setSequence((prev) => prev.slice(0, -1));
    } else if (e.code === "Enter") {
      e.preventDefault();
      setSequence((prev) => {
        const currentLineLength = prev.length % MAX_NOTES_PER_LINE;
        const padding = currentLineLength === 0 ? MAX_NOTES_PER_LINE : MAX_NOTES_PER_LINE - currentLineLength;
        const filler = Array.from({ length: padding }, () => ({ key: "space", stringIndex: null, fret: null }));
        return [...prev, ...filler, { key: "space", stringIndex: null, fret: null }];
      });
      setForceRenderLine((n) => n + 1);
      setLabels((prev) => [...prev, ""]);
      setShowLabelInputs((prev) => [...prev, false]);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLabelChange = (index, value) => {
    setLabels((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const toggleLabelInput = (index) => {
    setShowLabelInputs((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        setLabels((prevLabels) => {
          const updatedLabels = [...prevLabels];
          updatedLabels[index] = "";
          return updatedLabels;
        });
      }
      updated[index] = !updated[index];
      return updated;
    });
  };

  const handleExportImage = async () => {
    if (tabRef.current) {
      const buttons = tabRef.current.querySelectorAll('.label-toggle');
      buttons.forEach(btn => btn.style.display = 'none');
      const canvas = await html2canvas(tabRef.current);
      buttons.forEach(btn => btn.style.display = 'inline-block');
      const link = document.createElement("a");
      link.download = "bass-tab.png";
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const handleExportPDF = async () => {
    if (tabRef.current) {
      const buttons = tabRef.current.querySelectorAll('.label-toggle');
      buttons.forEach(btn => btn.style.display = 'none');
      const canvas = await html2canvas(tabRef.current);
      buttons.forEach(btn => btn.style.display = 'inline-block');
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
    setLabels([]);
    setShowLabelInputs([]);
  };
  const specialSymbols = ['\\', '/', 'x', 'h', 'p'];

  const renderString = (stringName, stringIndex) => (
    <div className="string-row" key={stringName} style={{ display: 'flex', alignItems: 'center' }}>
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
      <div className="symbol-buttons" style={{ marginLeft: '12px' }}>
        {specialSymbols.map((symbol) => (
          <button
            key={`${stringIndex}-symbol-${symbol}`}
            onClick={() => handleNoteSelect(stringIndex, symbol)}
            className="fret-button"
          >
            {symbol}
          </button>
        ))}
      </div>
    </div>
  );

  const renderTabOutput = () => {
    const chunks = sequence.length === 0
      ? [Array(1).fill({ key: "space", stringIndex: null, fret: null })]
      : sequence.reduce((acc, curr) => {
          const newAcc = [...acc];
          let currentChunk = newAcc[newAcc.length - 1];

          const width = curr.stringIndex === null
            ? 2
            : String(curr.fret).length + 1;

          const currentLength = currentChunk.reduce((sum, note) => {
            return sum + (note.stringIndex === null ? 2 : String(note.fret).length + 1);
          }, 0);

          if (currentLength + width > MAX_NOTES_PER_LINE * 2) {
            currentChunk = [];
            newAcc.push(currentChunk);
          }

          currentChunk.push(curr);
          return newAcc;
        }, [[]]);

    return chunks.map((chunk, chunkIndex) => {
      const tabLines = strings.map((s) => s + "|");

      for (let col = 0; col < chunk.length; col++) {
        const widths = strings.map((_, strIdx) => {
          const note = chunk[col];
          if (note.stringIndex === strIdx) {
            return String(note.fret).length + 1;
          }
          return 2;
        });

        const colWidth = Math.max(...widths);

        strings.forEach((_, strIdx) => {
          const note = chunk[col];
          if (note.stringIndex === null) {
            tabLines[strIdx] += "-".repeat(colWidth);
          } else if (note.stringIndex === strIdx) {
            const value = `-${note.fret}`;
            tabLines[strIdx] += value.padEnd(colWidth, "-");
          } else {
            tabLines[strIdx] += "-".repeat(colWidth);
          }
        });
      }

      return (
        <div key={`chunk-${chunkIndex}-${forceRenderLine}`} className="tab-section">
          {(!labels[chunkIndex] || showLabelInputs[chunkIndex]) && (
            <button onClick={() => toggleLabelInput(chunkIndex)} className="label-toggle">
              {showLabelInputs[chunkIndex] ? "Delete Label" : "Add Label"}
            </button>
          )}
          {showLabelInputs[chunkIndex] && (
            <input
              type="text"
              placeholder="Section name (e.g., Verse, Chorus)"
              value={labels[chunkIndex] || ""}
              onChange={(e) => handleLabelChange(chunkIndex, e.target.value)}
              className="section-label-input section-label-display"
            />
          )}
          {labels[chunkIndex] && !showLabelInputs[chunkIndex] && (
            <div className="section-label-display">{labels[chunkIndex]}</div>
          )}
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

        <div className="keyboard-hints" style={{ marginTop: '16px' }}>
          <p><strong>Keyboard Shortcuts:</strong></p>
          <ul>
            <li><strong>Space</strong> – Add a space between notes</li>
            <li><strong>Enter</strong> – Start a new tab line</li>
            <li><strong>Backspace/Delete</strong> – Remove the last note</li>
          </ul>
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