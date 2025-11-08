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
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white border-2 border-slate-200 max-w-md w-full overflow-hidden">
          {/* Header */}
          <div className="bg-red-600 text-white p-6 text-center">
            <div className="w-16 h-16 bg-white/20 border border-slate-200 mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-2">Camera Access Required</h3>
            <p className="text-red-100">
              Please allow camera access to scan QR codes and verify tickets
            </p>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-slate-900"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-sm">Secure and private scanning</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-slate-900"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-sm">No data stored or transmitted</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-slate-900"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-sm">Local processing only</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 font-semibold transition-colors"
            >
              Close Scanner
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border-2 border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 border border-slate-200 flex items-center justify-center">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">QR Code Scanner</h3>
                <p className="text-blue-100 text-sm">
                  Position QR code in the frame
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 border border-slate-200 flex items-center justify-center transition-all duration-200"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Scanner Content */}
        <div className="p-6">
          {/* Camera View */}
          <div className="relative bg-slate-900 border border-slate-300 overflow-hidden mb-6">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="w-full h-auto "
              onUserMediaError={(err) => {
                console.error("Webcam error:", err);
                setHasPermission(false);
              }}
            />

            {/* Scanning Animation Overlay */}
            {scanning && (
              <div className="absolute inset-0 bg-blue-500/10 animate-pulse">
                <div className="absolute inset-4 border-2 border-slate-900">
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>
                </div>
              </div>
            )}

            {/* QR Code Target Frame */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-48 h-48">
                {/* Corner markers */}
                <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-white"></div>
                <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-white"></div>
                <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-white"></div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-white"></div>

                {/* Center guidance */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
                </div>
              </div>
            </div>

            {/* Instructions overlay */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/60 text-white px-4 py-2 border border-slate-200 text-center">
                <p className="text-sm font-medium">
                  {scanning
                    ? "Scanning QR code..."
                    : "Align QR code within the frame"}
                </p>
              </div>
            </div>
          </div>

          {/* Scanning Mode Toggle */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setCaptureMode("manual")}
              className={`flex-1 py-3 px-4 font-semibold transition-colors border-2 ${
                captureMode === "manual"
                  ? "bg-slate-900 text-white border-transparent"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Manual
              </div>
            </button>
            <button
              onClick={() => setCaptureMode("auto")}
              className={`flex-1 py-3 px-4 font-semibold transition-colors border-2 ${
                captureMode === "auto"
                  ? "bg-slate-900 text-white border-transparent"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Auto Scan
              </div>
            </button>
          </div>

          {/* Manual Capture Button */}
          {captureMode === "manual" && (
            <div className="flex flex-col items-center justify-center">
              <button
                onClick={handleManualCapture}
                disabled={scanning || !hasPermission}
                className="w-20 h-20 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-full flex items-center justify-center transition-colors"
              >
                {scanning ? (
                  <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
              <p className="text-slate-600 text-sm mt-3">Tap to capture</p>
            </div>
          )}

          {/* Auto Scanning Indicator */}
          {captureMode === "auto" && (
            <div className="text-center">
              <div className="inline-flex items-center gap-3 bg-slate-100 text-slate-900 px-6 py-3 border border-slate-200">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-semibold">
                  {scanning ? "Auto scanning active..." : "Auto scan ready"}
                </span>
              </div>
            </div>
          )}

          {/* Status Information */}
          <div className="mt-6 bg-slate-50 border border-slate-200 p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    hasPermission ? "bg-emerald-500" : "bg-red-500"
                  }`}
                ></div>
                <span className="text-slate-600">
                  Camera: {hasPermission ? "Ready" : "Unavailable"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    scanning ? "bg-blue-500 animate-pulse" : "bg-slate-300"
                  }`}
                ></div>
                <span className="text-slate-600">
                  Status: {scanning ? "Scanning" : "Standby"}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="flex items-center gap-2 text-slate-600">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm">
                  Mode:{" "}
                  {captureMode === "auto"
                    ? "Automatic scanning"
                    : "Manual capture"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
