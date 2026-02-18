/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, ArrowLeft, CheckCircle, ShieldCheck } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { StepIndicator } from "@/components/StepIndicator";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type StepId = "aadhaar" | "voter" | "certificates";

interface UploadState {
  file: File | null;
  progress: number;
  status: "idle" | "uploading" | "success" | "error";
  error?: string;
}

const STEPS = [
  { id: "aadhaar", label: "Aadhaar Card" },
  { id: "voter", label: "Voter ID" },
  { id: "certificates", label: "Skill Certificates" },
];

export default function App() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [uploads, setUploads] = useState<Record<StepId, UploadState>>({
    aadhaar: { file: null, progress: 0, status: "idle" },
    voter: { file: null, progress: 0, status: "idle" },
    certificates: { file: null, progress: 0, status: "idle" },
  });

  const currentStepId = STEPS[currentStepIndex].id as StepId;
  const currentUpload = uploads[currentStepId];

  const handleFileSelect = (file: File) => {
    setUploads((prev) => ({
      ...prev,
      [currentStepId]: {
        file,
        progress: 0,
        status: "idle",
      },
    }));
  };

  const handleRemoveFile = () => {
    setUploads((prev) => ({
      ...prev,
      [currentStepId]: {
        file: null,
        progress: 0,
        status: "idle",
      },
    }));
  };

  const simulateUpload = async () => {
    if (!currentUpload.file) return;

    setUploads((prev) => ({
      ...prev,
      [currentStepId]: { ...prev[currentStepId], status: "uploading" },
    }));

    // Simulate network latency and progress
    const totalDuration = 2000; // 2 seconds
    const intervalTime = 100;
    const steps = totalDuration / intervalTime;
    let currentProgress = 0;

    return new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        currentProgress += 100 / steps;
        
        // Add some randomness to the progress
        const randomIncrement = Math.random() * 5;
        currentProgress = Math.min(currentProgress + randomIncrement, 99);

        setUploads((prev) => ({
          ...prev,
          [currentStepId]: {
            ...prev[currentStepId],
            progress: currentProgress,
          },
        }));

        if (currentProgress >= 99) {
          clearInterval(interval);
          setUploads((prev) => ({
            ...prev,
            [currentStepId]: {
              ...prev[currentStepId],
              progress: 100,
              status: "success",
            },
          }));
          resolve();
        }
      }, intervalTime);
    });
  };

  const handleNext = async () => {
    if (currentUpload.status === "idle" || currentUpload.status === "error") {
      await simulateUpload();
    }

    if (currentStepIndex < STEPS.length - 1) {
      setTimeout(() => setCurrentStepIndex((prev) => prev + 1), 500);
    } else {
      setTimeout(() => setIsComplete(true), 500);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  if (isComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-900/5"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-slate-900">
            Documents Uploaded!
          </h2>
          <p className="mb-8 text-slate-500">
            Your Aadhaar, Voter ID, and certificates have been securely uploaded and
            are pending verification.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="w-full"
            size="lg"
          >
            Upload New Documents
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Secure Document Upload
          </h1>
          <p className="mt-2 text-slate-500">
            Please provide your identity documents for verification.
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-900/5 sm:p-10">
          <StepIndicator steps={STEPS} currentStep={currentStepIndex} />

          <div className="mt-8 min-h-[300px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStepIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentStepIndex === 0 && (
                  <FileUpload
                    label="Upload Aadhaar Card"
                    description="Please upload a clear copy of your Aadhaar card (Front & Back combined or single side)."
                    onFileSelect={handleFileSelect}
                    onRemoveFile={handleRemoveFile}
                    progress={uploads.aadhaar.progress}
                    status={uploads.aadhaar.status}
                    file={uploads.aadhaar.file}
                    acceptedFileTypes={{
                      "image/*": [".png", ".jpg", ".jpeg"],
                      "application/pdf": [".pdf"],
                    }}
                  />
                )}
                {currentStepIndex === 1 && (
                  <FileUpload
                    label="Upload Voter ID"
                    description="Please upload a valid Voter ID card for address verification."
                    onFileSelect={handleFileSelect}
                    onRemoveFile={handleRemoveFile}
                    progress={uploads.voter.progress}
                    status={uploads.voter.status}
                    file={uploads.voter.file}
                    acceptedFileTypes={{
                      "image/*": [".png", ".jpg", ".jpeg"],
                      "application/pdf": [".pdf"],
                    }}
                  />
                )}
                {currentStepIndex === 2 && (
                  <FileUpload
                    label="Upload Skill Certificates"
                    description="Upload your highest qualification or relevant skill certificates."
                    onFileSelect={handleFileSelect}
                    onRemoveFile={handleRemoveFile}
                    progress={uploads.certificates.progress}
                    status={uploads.certificates.status}
                    file={uploads.certificates.file}
                    maxSize={10 * 1024 * 1024} // 10MB
                    acceptedFileTypes={{
                      "application/pdf": [".pdf"],
                      "image/*": [".png", ".jpg", ".jpeg"],
                    }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStepIndex === 0 || currentUpload.status === "uploading"}
              className={cn(currentStepIndex === 0 && "invisible")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!currentUpload.file || currentUpload.status === "uploading"}
              className="min-w-[140px]"
            >
              {currentUpload.status === "uploading" ? (
                "Uploading..."
              ) : (
                <>
                  {currentStepIndex === STEPS.length - 1 ? "Submit" : "Next Step"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
        
        <p className="mt-6 text-center text-xs text-slate-400">
          Your data is encrypted and securely stored.
          <br />
          Read our <a href="#" className="underline hover:text-slate-500">Privacy Policy</a> for more information.
        </p>
      </div>
    </div>
  );
}

