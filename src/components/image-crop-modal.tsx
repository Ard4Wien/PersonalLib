"use client";

import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, Check, X } from "lucide-react";

interface ImageCropModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string;
    onCropComplete: (croppedImage: string) => void;
}


const createCroppedImage = async (
    imageSrc: string,
    pixelCrop: Area
): Promise<string> => {
    const image = new Image();
    image.src = imageSrc;

    await new Promise((resolve) => {
        image.onload = resolve;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("Canvas context not found");
    }


    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;


    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );


    return canvas.toDataURL("image/jpeg", 0.9);
};

export function ImageCropModal({
    isOpen,
    onClose,
    imageSrc,
    onCropComplete,
}: ImageCropModalProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropCompleteHandler = useCallback(
        (_croppedArea: Area, croppedAreaPixels: Area) => {
            setCroppedAreaPixels(croppedAreaPixels);
        },
        []
    );

    const handleSave = async () => {
        if (!croppedAreaPixels) return;

        try {
            const croppedImage = await createCroppedImage(imageSrc, croppedAreaPixels);
            onCropComplete(croppedImage);
            onClose();
        } catch (error) {
            console.error("Error cropping image:", error);
        }
    };

    const handleZoomChange = (value: number[]) => {
        setZoom(value[0]);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-slate-950/95 backdrop-blur-xl border-white/10 shadow-2xl shadow-purple-500/10">
                <DialogHeader>
                    <DialogTitle className="text-white">Fotoğrafı Kırp</DialogTitle>
                    <DialogDescription className="sr-only">
                        Profil fotoğrafınızı uygun boyuta getirmek için kırpın.
                    </DialogDescription>
                </DialogHeader>

                <div className="relative w-full h-72 bg-black rounded-lg overflow-hidden">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropCompleteHandler}
                    />
                </div>


                <div className="flex items-center gap-4 px-2">
                    <ZoomOut className="h-4 w-4 text-gray-400" />
                    <Slider
                        value={[zoom]}
                        min={1}
                        max={3}
                        step={0.1}
                        onValueChange={handleZoomChange}
                        className="flex-1"
                    />
                    <ZoomIn className="h-4 w-4 text-gray-400" />
                </div>

                <DialogFooter className="flex gap-2 sm:gap-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 border-white/10 bg-transparent text-white hover:bg-white/5"
                    >
                        <X className="h-4 w-4 mr-2" />
                        İptal
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    >
                        <Check className="h-4 w-4 mr-2" />
                        Kaydet
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
