import { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";

const QRScanner = ({ onScan, onError, isScanning, onClose }) => {
  const webcamRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [captureMode, setCaptureMode] = useState("manual");
  const [hasPermission, setHasPermission] = useState(null);

  // Check camera permission
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        setHasPermission(true);
        stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        console.error("Camera permission denied:", err);
        setHasPermission(false);
        onError && onError("Camera permission denied");
      }
    };

    checkPermission();
  }, [onError]);

  // Auto-scanning effect
  useEffect(() => {
    let intervalId;

    if (
      isScanning &&
      captureMode === "auto" &&
      webcamRef.current &&
      hasPermission
    ) {
      setScanning(true);
      intervalId = setInterval(async () => {
        await scanCurrentFrame();
      }, 1000); // Scan every 1 second for better performance
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (captureMode === "auto") {
        setScanning(false);
      }
    };
  }, [isScanning, captureMode, hasPermission]);

  const scanCurrentFrame = async () => {
    try {
      if (!webcamRef.current) {
        console.log("Webcam not ready");
        return;
      }

      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        console.log("No image captured");
        return;
      }

      console.log("Attempting to scan QR code...");

      // Try using native BarcodeDetector API first (Chrome/Edge)
      if ("BarcodeDetector" in window) {
        try {
          const barcodeDetector = new window.BarcodeDetector({
            formats: ["qr_code"],
          });

          const img = new Image();
          img.onload = async () => {
            try {
              const barcodes = await barcodeDetector.detect(img);
              if (barcodes.length > 0) {
                console.log("QR Code detected:", barcodes[0].rawValue);
                onScan(barcodes[0].rawValue);
                setScanning(false);
                return;
              }
            } catch (err) {
              console.log("BarcodeDetector failed, trying alternative method");
              await fallbackScan(img);
            }
          };
          img.src = imageSrc;
        } catch (err) {
          console.log("BarcodeDetector not supported, using fallback");
          await fallbackScan(imageSrc);
        }
      } else {
        console.log("BarcodeDetector not available, using fallback");
        await fallbackScan(imageSrc);
      }
    } catch (err) {
      console.error("Error scanning QR code:", err);
      onError && onError("Scanning error: " + err.message);
    }
  };

  const fallbackScan = async (imageSrc) => {
    try {
      // Import zxing library dynamically
      const { BrowserMultiFormatReader } = await import("@zxing/library");
      const codeReader = new BrowserMultiFormatReader();

      if (typeof imageSrc === "string") {
        // If imageSrc is a data URL, create an image
        const img = new Image();
        img.onload = async () => {
          try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );
            const result = await codeReader.decodeFromImageData(imageData);

            if (result) {
              console.log("QR Code detected with ZXing:", result.getText());
              onScan(result.getText());
              setScanning(false);
            }
          } catch (err) {
            console.log("ZXing scan failed:", err.message);
          }
        };
        img.src = imageSrc;
      } else {
        // If imageSrc is already an image element
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = imageSrc.width;
        canvas.height = imageSrc.height;
        ctx.drawImage(imageSrc, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = await codeReader.decodeFromImageData(imageData);

        if (result) {
          console.log("QR Code detected with ZXing:", result.getText());
          onScan(result.getText());
          setScanning(false);
        }
      }
    } catch (err) {
      console.log("Fallback scan failed:", err.message);
    }
  };

  const handleManualCapture = async () => {
    console.log("Manual capture initiated");
    setScanning(true);
    await scanCurrentFrame();
    setTimeout(() => setScanning(false), 2000); // Show scanning feedback for 2 seconds
  };

  const videoConstraints = {
    width: { ideal: 640 },
    height: { ideal: 640 },
    facingMode: "environment", // Use back camera on mobile
  };

  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">
              Camera Permission Required
            </h3>
            <p className="text-gray-600 mb-4">
              Please allow camera access to scan QR codes.
            </p>
            <button
              onClick={onClose}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Scan QR Code</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="w-full h-auto"
              onUserMediaError={(err) => {
                console.error("Webcam error:", err);
                setHasPermission(false);
              }}
            />
            {scanning && (
              <div className="absolute inset-0 border-2 border-blue-500 animate-pulse">
                <div className="absolute top-2 left-2 right-2 bottom-2 border-2 border-white opacity-50"></div>
              </div>
            )}

            {/* Crosshair overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-32 h-32 border-2 border-white opacity-70">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500"></div>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 mt-3 text-center">
            Position the QR code within the frame and tap capture
          </p>

          {/* Scanning mode toggle */}
          <div className="flex gap-2 mt-3 mb-3">
            <button
              onClick={() => setCaptureMode("manual")}
              className={`px-3 py-1 text-xs rounded ${
                captureMode === "manual"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Manual
            </button>
            <button
              onClick={() => setCaptureMode("auto")}
              className={`px-3 py-1 text-xs rounded ${
                captureMode === "auto"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Auto Scan
            </button>
          </div>

          {/* Manual capture button */}
          {captureMode === "manual" && (
            <button
              onClick={handleManualCapture}
              disabled={scanning || !hasPermission}
              className="mt-2 w-16 h-16 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg"
            >
              {scanning ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "📸"
              )}
            </button>
          )}

          {/* Auto scanning indicator */}
          {captureMode === "auto" && scanning && (
            <div className="flex items-center mt-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
              <span className="text-sm text-blue-600">Auto scanning...</span>
            </div>
          )}

          {/* Debug info */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>Camera: {hasPermission ? "✓ Ready" : "✗ Not available"}</p>
            <p>Mode: {captureMode}</p>
            {scanning && <p>Status: Scanning...</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
