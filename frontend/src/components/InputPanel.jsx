import { useState, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { fetchProductData } from '../utils/api';
import "../styles/InputPanel.css";

const ConsumerInputPanel = ({ setInputs, setFoundProducts }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let scanner = null;

    if (isScanning) {
      // 1. Explicitly enable Barcode formats (EAN/UPC) + QR
      const formatsToSupport = [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
      ];

      scanner = new Html5QrcodeScanner("reader", {
        fps: 20,
        qrbox: { width: 300, height: 180 }, // Rectangular for barcodes
        aspectRatio: 1.777778,
        formatsToSupport: formatsToSupport,
        rememberLastUsedCamera: true,
      });

      scanner.render(
        async (decodedText) => {
          setError(null);
          try {
            // Immediately stop camera to prevent double-calls
            await scanner.clear();
            setIsScanning(false);
            
            const productData = await fetchProductData(decodedText);
            if (productData) {
              // Update main HUD
              setInputs(productData);
              // Add to History/Alternatives list
              setFoundProducts(prev => [productData, ...prev]);
            } else {
              setError("PRODUCT_NOT_FOUND");
            }
          } catch (err) {
            setError("SCAN_ERROR");
            console.error(err);
          }
        },
        (errorMessage) => {
          console.error(errorMessage);
          // 2. SILENCE THE ERRORS:
          // Leaving this empty stops the 'NotFoundException' console spam.
          // It only fires when a frame has no detectable code.
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.warn("Scanner Cleanup:", e));
      }
    };
  }, [isScanning, setInputs, setFoundProducts]);

  return (
    <div className="input-panel consumer-mode">
      <div className="scanner-header">
        <h2 className="highlight">CONSUMER_SCAN_OS</h2>
        <p className="small-text">// TARGET: PRODUCT_BARCODE_OR_QR</p>
      </div>

      {isScanning ? (
        <div className="scanner-container">
          <div id="reader"></div>
          <button className="hud-button abort" onClick={() => setIsScanning(false)}>
            TERMINATE_LINK
          </button>
        </div>
      ) : (
        <div className="init-view">
          <div className="scan-animation-placeholder">
            <div className="laser-line"></div>
          </div>
          <button className="hud-button init-scan" onClick={() => setIsScanning(true)}>
            INITIALIZE_OPTIC_SCAN
          </button>
        </div>
      )}

      {error && <p className="error-msg highlight">!! {error} !!</p>}

      <div className="system-status">
        <p className="small-text">// SENSOR_STATUS: {isScanning ? "SCANNING..." : "IDLE"}</p>
      </div>
    </div>
  );
};

export default ConsumerInputPanel;
