import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { PDFDocument, rgb } from 'pdf-lib';
import { saveAs } from 'file-saver';

const SignPDFOverCanvas = ({ base64PDF }) => {
  const sigCanvas = useRef(null);
  const [signedPdfUrl, setSignedPdfUrl] = useState(null);

  const handleClear = () => {
    sigCanvas.current.clear();
  };

  const handleSave = async () => {
    if (!base64PDF) return alert('No PDF loaded.');

    const signatureDataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');

    const pdfBytes = await fetch(base64PDF).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const pngImageBytes = await fetch(signatureDataUrl).then(res => res.arrayBuffer());
    const pngImage = await pdfDoc.embedPng(pngImageBytes);

    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();
    page.drawImage(pngImage, {
      x: width - 150,
      y: 50,
      width: 100,
      height: 40,
    });

    const modifiedPdfBytes = await pdfDoc.save();
    const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });

    const signedUrl = URL.createObjectURL(blob);
    setSignedPdfUrl(signedUrl);

    saveAs(blob, 'signed-letter.pdf');
  };

  return (
    <div>
      <h3>✍️ Draw Your Signature</h3>
      <SignatureCanvas
        ref={sigCanvas}
        penColor="black"
        canvasProps={{ width: 300, height: 150, className: 'sigCanvas' }}
      />
      <div>
        <button onClick={handleClear}>Clear</button>
        <button onClick={handleSave}>Save Signature to PDF</button>
      </div>

      {signedPdfUrl && (
        <div style={{ marginTop: 20 }}>
          <h4>🔍 Preview Signed PDF:</h4>
          <iframe src={signedPdfUrl} width="100%" height="500px" title="Signed PDF" />
        </div>
      )}
    </div>
  );
};

export default SignPDFOverCanvas;
