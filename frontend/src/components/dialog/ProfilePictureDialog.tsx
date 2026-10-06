import { useState, useCallback, useEffect } from "react";
import "@/components/dialog/ProfilePictureDialog.css";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import Dialog from "@/components/dialog/Dialog";
import DialogActions from "@/components/dialog/DialogActions";
import { getCroppedImageBlob } from "@/services/cropImageUtil.tsx";
import {snackbarService} from "@/services/snackBarService.tsx";
import {ApiRequestError} from "@/services/api.tsx";

const MAX_FILE_SIZE_MB = 20;

type ImageKind = "png" | "jpeg" | "gif";

const kindFromType = (type: string): ImageKind | null => {
    switch (type.toLowerCase().split(";")[0].trim()) {
        case "image/png":
        case "image/x-png":
            return "png";
        case "image/jpeg":
        case "image/jpg":
        case "image/pjpeg":
            return "jpeg";
        case "image/gif":
        case "image/x-gif":
            return "gif";
        default:
            return null;
    }
};

const kindFromName = (name: string): ImageKind | null => {
    const lower = name.toLowerCase();
    if (lower.endsWith(".gif")) return "gif";
    if (lower.endsWith(".png")) return "png";
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "jpeg";
    return null;
};

const sniffKind = async (file: File): Promise<ImageKind | null> => {
    const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const offset = header.length >= 3 && header[0] === 0xef && header[1] === 0xbb && header[2] === 0xbf ? 3 : 0;
    const bytes = header.subarray(offset);
    if (bytes.length >= 6
        && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46
        && bytes[3] === 0x38 && (bytes[4] === 0x37 || bytes[4] === 0x39)
        && bytes[5] === 0x61) {
        return "gif";
    }
    if (bytes.length >= 8
        && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
        return "png";
    }
    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        return "jpeg";
    }
    return null;
};

const resolveKind = async (file: File): Promise<ImageKind | null> => {
    const sniffed = await sniffKind(file);
    if (sniffed) return sniffed;
    const fromType = kindFromType(file.type);
    if (fromType) return fromType;
    const type = file.type.toLowerCase().split(";")[0].trim();
    if (type === "" || type === "application/octet-stream") {
        return kindFromName(file.name);
    }
    return null;
};

interface ProfilePictureDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (file: Blob, isGif: boolean) => Promise<void> | void;
}

export default function ProfilePictureDialog({
                                                 isOpen,
                                                 onClose,
                                                 onUpload,
                                             }: ProfilePictureDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [isGif, setIsGif] = useState(false);

    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    useEffect(() => {
        return () => {
            if (imageSrc) {
                URL.revokeObjectURL(imageSrc);
            }
        };
    }, [imageSrc]);

    const resetState = useCallback(() => {
        setFile(null);
        setImageSrc(null);
        setIsGif(false);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        setIsSubmitting(false);
        setIsDraggingOver(false);
    }, []);

    const handleClose = () => {
        resetState();
        onClose();
    };

    const applySelectedFile = useCallback((selected: File | undefined | null) => {
        if (!selected) return;

        void (async () => {
            try {
                if (selected.size === 0) {
                    snackbarService.showSnackbar({ type: "error", text: "Die Datei ist leer oder noch nicht heruntergeladen. Speichere sie lokal und versuche es erneut.", showIcon: true });
                    return;
                }

                const kind = await resolveKind(selected);
                if (!kind) {
                    snackbarService.showSnackbar({ type: "error", text: "Bitte wähle ein PNG-, JPG/JPEG- oder GIF-Bild aus", showIcon: true });
                    return;
                }

                if (selected.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
                    const sizeMb = (selected.size / (1024 * 1024)).toFixed(1);
                    snackbarService.showSnackbar({ type: "error", text: `Die Datei ist ${sizeMb} MB groß. Maximal erlaubt sind ${MAX_FILE_SIZE_MB} MB.`, showIcon: true });
                    return;
                }

                const type = kind === "gif" ? "image/gif" : kind === "png" ? "image/png" : "image/jpeg";
                const typed = selected.type === type ? selected : new File([selected], selected.name, {type});
                setFile(typed);
                setIsGif(kind === "gif");
                setImageSrc(URL.createObjectURL(typed));
            } catch {
                snackbarService.showSnackbar({ type: "error", text: "Die Datei konnte nicht gelesen werden. Speichere sie lokal und versuche es erneut.", showIcon: true });
            }
        })();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        e.target.value = "";
        applySelectedFile(selected);
    };

    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);

        const dropped = e.dataTransfer.files?.[0];
        applySelectedFile(dropped);
    };

    const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleConfirm = async () => {
        if (!file || !imageSrc) return;

        setIsSubmitting(true);

        try {
            if (isGif) {
                await onUpload(file, true);
            } else {
                if (!croppedAreaPixels) return;
                const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels, file.type);
                await onUpload(blob, false);
            }
            resetState();
            onClose();
        } catch (error) {
            if (!(error instanceof ApiRequestError)) {
                snackbarService.showSnackbar({ type: "error", text: "Upload fehlgeschlagen. Bitte versuche es erneut.", showIcon: true });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog
            isOpen={isOpen}
            title="Profilbild ändern"
            subtitle="Lade ein Bild (PNG/JPG) oder GIF hoch"
            onClose={handleClose}
        >
            <div className="profile-picture-dialog-content">
                {!imageSrc && (
                    <label
                        className={`profile-picture-upload-area${isDraggingOver ? " profile-picture-upload-area-dragging" : ""}`}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/gif,.png,.jpg,.jpeg,.gif"
                            onChange={handleFileChange}
                            hidden
                        />
                        <span>
                            {isDraggingOver
                                ? "Bild hier loslassen"
                                : "Klicke oder ziehe ein Bild/GIF hierher"}
                        </span>
                    </label>
                )}

                {imageSrc && !isGif && (
                    <div className="profile-picture-cropper">
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropShape="round"
                            showGrid={false}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                        />
                    </div>
                )}

                {imageSrc && isGif && (
                    <div className="profile-picture-gif-preview">
                        <img src={imageSrc} alt="GIF preview" />
                        <p className="profile-picture-gif-note">
                            GIFs werden ohne Zuschnitt hochgeladen, damit die Animation erhalten bleibt.
                        </p>
                    </div>
                )}

                {imageSrc && (
                    <DialogActions
                        cancel={{text: "Abbrechen", onClick: handleClose, type: "button"}}
                        confirm={{
                            text: isSubmitting ? "Lädt hoch..." : "Bestätigen",
                            onClick: handleConfirm,
                            type: "button",
                            disabled: isSubmitting,
                        }}
                    />
                )}
            </div>
        </Dialog>
    );
}