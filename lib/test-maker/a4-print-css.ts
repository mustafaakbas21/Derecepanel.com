/**
 * Test Maker A4 yazdırma / PDF — katı A4 sayfa + chunk sayfalama.
 */
export const TM_A4_PRINT_CSS = `
@page { size: A4 portrait; margin: 0; }
html, body {
  margin: 0;
  padding: 0;
  background: #fff !important;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
#tm-a4-page {
  width: 210mm !important;
  max-width: 210mm !important;
  margin: 0 auto !important;
  padding: 0 !important;
  transform: none !important;
  background: #fff !important;
}
#tm-a4-page.space-y-8 > * + * {
  margin-top: 0 !important;
}
.tm-a4-sheet {
  box-sizing: border-box !important;
  width: 210mm !important;
  max-width: 210mm !important;
  margin: 0 auto !important;
  border: none !important;
  box-shadow: none !important;
  background: #fff !important;
}
.tm-a4-sheet.tm-q-question-sheet,
#tm-sheet-cover {
  display: flex !important;
  flex-direction: column !important;
  height: 297mm !important;
  max-height: 297mm !important;
  min-height: 297mm !important;
  overflow: hidden !important;
}
.tm-q-sheet-body {
  display: flex !important;
  flex: 1 1 auto !important;
  flex-direction: row !important;
  align-items: flex-start !important;
  width: 100% !important;
  min-height: 0 !important;
  overflow: hidden !important;
  position: relative !important;
}
.tm-q-col-spine {
  display: block !important;
  background-color: var(--tm-divider-color, #cbd5e1) !important;
}
.tm-q-sheet-header,
.tm-q-sheet-footer {
  flex-shrink: 0 !important;
  height: 5rem !important;
  min-height: 5rem !important;
  max-height: 5rem !important;
  overflow: hidden !important;
}
.tm-q-col-left,
.tm-q-col-right {
  flex: 1 1 0 !important;
  min-width: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: flex-start !important;
  gap: 2rem !important;
  overflow: hidden !important;
}
.tm-q-sheet-body .tm-q-item {
  width: 100% !important;
}
.tm-q-image {
  width: 100% !important;
  height: auto !important;
  object-fit: contain !important;
  object-position: top !important;
}
.hidden {
  display: none !important;
}
.tm-q-answer-picker,
.teacher-only-ui {
  display: none !important;
}
.tm-optic-sheet {
  display: flex !important;
  flex-direction: column !important;
  height: 297mm !important;
  max-height: 297mm !important;
  min-height: 297mm !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}
.tm-optic-form {
  width: 100% !important;
  height: 100% !important;
  min-height: 0 !important;
}
`;
