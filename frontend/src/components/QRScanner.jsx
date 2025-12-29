import { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import { Camera, X, AlertCircle, Scan, Check, Info, RotateCcw } from 'lucide-react';

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
        <div className="bg-bg-primary rounded-lg border border-border max-w-md w-full overflow-hidden">
          {/* Header */}
          <div className="bg-error text-bg-primary p-6 text-center rounded-t-lg">
            <div className="w-16 h-16 bg-bg-primary/20 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Camera Access Required</h3>
            <p className="text-red-100">
              Please allow camera access to scan QR codes and verify tickets
            </p>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 text-text-secondary">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm">Secure and private scanning</span>
              </div>
              <div className="flex items-center gap-3 text-text-secondary">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm">No data stored or transmitted</span>
              </div>
              <div className="flex items-center gap-3 text-text-secondary">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm">Local processing only</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-primary hover:bg-primary/90 text-bg-primary rounded-lg px-6 py-3 font-semibold transition-colors cursor-pointer"
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
      <div className="bg-bg-primary rounded-lg border border-border max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-primary text-bg-primary p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-bg-primary/20 rounded-lg flex items-center justify-center">
                <Scan className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">QR Code Scanner</h3>
                <p className="text-bg-primary/80 text-sm">
                  Position QR code in the frame
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-bg-primary/20 hover:bg-bg-primary/30 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scanner Content */}
        <div className="p-6">
          {/* Camera View */}
          <div className="relative bg-black border border-border rounded-lg overflow-hidden mb-6">
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
              <div className="absolute inset-0 bg-primary/10 animate-pulse">
                <div className="absolute inset-4 border-2 border-primary rounded-lg">
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                </div>
              </div>
            )}

            {/* QR Code Target Frame */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-48 h-48">
                {/* Corner markers */}
                <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-bg-primary rounded-lg"></div>
                <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-bg-primary rounded-lg"></div>
                <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-bg-primary rounded-lg"></div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-bg-primary rounded-lg"></div>

                {/* Center guidance */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-bg-primary rounded-full opacity-50"></div>
                </div>
              </div>
            </div>

            {/* Instructions overlay */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/60 text-bg-primary px-4 py-2 rounded-lg text-center">
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
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors cursor-pointer ${
                captureMode === "manual"
                  ? "bg-primary text-bg-primary"
                  : "bg-bg-secondary text-text-primary border border-border hover:bg-bg-secondary/80"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Camera className="w-5 h-5" />
                Manual
              </div>
            </button>
            <button
              onClick={() => setCaptureMode("auto")}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors cursor-pointer ${
                captureMode === "auto"
                  ? "bg-primary text-bg-primary"
                  : "bg-bg-secondary text-text-primary border border-border hover:bg-bg-secondary/80"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <RotateCcw className="w-5 h-5" />
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
                className="w-20 h-20 bg-primary hover:bg-primary/90 disabled:bg-primary/40 text-bg-primary rounded-full flex items-center justify-center transition-colors cursor-pointer"
              >
                {scanning ? (
                  <div className="w-8 h-8 border-3 border-bg-primary border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera className="w-8 h-8" />
                )}
              </button>
              <p className="text-text-secondary text-sm mt-3">Tap to capture</p>
            </div>
          )}

          {/* Auto Scanning Indicator */}
          {captureMode === "auto" && (
            <div className="text-center">
              <div className="inline-flex items-center gap-3 bg-primary/10 text-primary px-6 py-3 rounded-lg border border-primary/20">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="font-semibold">
                  {scanning ? "Auto scanning active..." : "Auto scan ready"}
                </span>
              </div>
            </div>
          )}

          {/* Status Information */}
          <div className="mt-6 bg-bg-secondary border border-border rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    hasPermission ? "bg-emerald-500" : "bg-red-500"
                  }`}
                ></div>
                <span className="text-text-secondary">
                  Camera: {hasPermission ? "Ready" : "Unavailable"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    scanning ? "bg-primary animate-pulse" : "bg-text-secondary/30"
                  }`}
                ></div>
                <span className="text-text-secondary">
                  Status: {scanning ? "Scanning" : "Standby"}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2 text-text-secondary">
                <Info className="w-4 h-4" />
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
