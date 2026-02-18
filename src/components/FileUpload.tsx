import React, { useCallback, useState, useEffect } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { UploadCloud, File, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface FileUploadProps {
  label: string;
  description: string;
  maxSize?: number; // in bytes
  acceptedFileTypes?: Record<string, string[]>;
  onFileSelect: (file: File) => void;
  onRemoveFile: () => void;
  progress: number;
  status: "idle" | "uploading" | "success" | "error";
  errorMessage?: string;
  file: File | null;
}

export function FileUpload({
  label,
  description,
  maxSize = 5 * 1024 * 1024, // 5MB default
  acceptedFileTypes = {
    "image/*": [".png", ".jpg", ".jpeg"],
    "application/pdf": [".pdf"],
  },
  onFileSelect,
  onRemoveFile,
  progress,
  status,
  errorMessage,
  file,
}: FileUploadProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      setLocalError(null);
      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        if (rejection.errors[0].code === "file-too-large") {
          setLocalError(`File is too large. Max size is ${maxSize / 1024 / 1024}MB.`);
        } else if (rejection.errors[0].code === "file-invalid-type") {
          setLocalError("Invalid file type. Please upload a supported format.");
        } else {
          setLocalError(rejection.errors[0].message);
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [maxSize, onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    accept: acceptedFileTypes,
    multiple: false,
    disabled: status === "uploading" || status === "success",
  } as any);

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col space-y-1">
        <h3 className="text-lg font-medium text-slate-900">{label}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            {...getRootProps()}
            className={cn(
              "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 transition-colors hover:bg-slate-100/50 cursor-pointer",
              isDragActive && "border-blue-500 bg-blue-50",
              localError && "border-red-200 bg-red-50"
            )}
          >
            <input {...getInputProps()} />
            <div className="rounded-full bg-slate-100 p-4 mb-4 ring-8 ring-slate-50">
              <UploadCloud className="h-8 w-8 text-slate-400" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-slate-700">
                <span className="text-blue-600 hover:text-blue-700 hover:underline">
                  Click to upload
                </span>{" "}
                or drag and drop
              </p>
              <p className="text-xs text-slate-500">
                SVG, PNG, JPG or PDF (max. {maxSize / 1024 / 1024}MB)
              </p>
            </div>
            {localError && (
              <div className="mt-4 flex items-center text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
                <AlertCircle className="mr-2 h-4 w-4" />
                {localError}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="file-preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className={cn(
                  "rounded-lg p-2",
                  status === "error" ? "bg-red-100" : "bg-blue-50"
                )}>
                  <File className={cn(
                    "h-6 w-6",
                    status === "error" ? "text-red-500" : "text-blue-500"
                  )} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              
              {status !== "uploading" && status !== "success" && (
                <button
                  onClick={onRemoveFile}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              
              {status === "success" && (
                <div className="rounded-full bg-green-100 p-1 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className={cn(
                  "font-medium",
                  status === "error" ? "text-red-600" : 
                  status === "success" ? "text-green-600" : "text-slate-600"
                )}>
                  {status === "uploading" && "Uploading..."}
                  {status === "success" && "Upload complete"}
                  {status === "error" && "Upload failed"}
                  {status === "idle" && "Ready to upload"}
                </span>
                <span className="text-slate-400">{Math.round(progress)}%</span>
              </div>
              <Progress 
                value={progress} 
                className={cn(
                  "h-1.5",
                  status === "error" && "bg-red-100"
                )}
                indicatorClassName={cn(
                  status === "success" && "bg-green-500",
                  status === "error" && "bg-red-500"
                )}
              />
            </div>

            {status === "error" && errorMessage && (
              <p className="mt-2 text-xs text-red-600 flex items-center">
                <AlertCircle className="mr-1 h-3 w-3" />
                {errorMessage}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
