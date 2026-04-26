import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export function QRCodeDisplay({ value, size = 200 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, { width: size, margin: 1 });
    }
  }, [value, size]);

  return <canvas ref={canvasRef} width={size} height={size} />;
}
