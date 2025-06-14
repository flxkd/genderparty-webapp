// App.tsx
import './App.css';
import { useState, useEffect, useRef } from 'react';
import WebApp from '@twa-dev/sdk';
import 'react-datepicker/dist/react-datepicker.css';
import { QRCodeSVG } from 'qrcode.react';
import { markerBase64 } from './markerBase64';
import { createRoot } from 'react-dom/client';

type TelegramUser = {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
};

function App() {
    const [gender, setGender] = useState<'boy' | 'girl' | null>(null);
    const [user, setUser] = useState<TelegramUser | null>(null);
    const [qrUrl, setQrUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const qrRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.initDataUnsafe?.user) {
            setUser(tg.initDataUnsafe.user);
        }
    }, []);

    useEffect(() => {
        if (gender !== null) {
            generateQR();
        }
    }, [gender]);

    const generateQR = async () => {
        if (!user) {
            WebApp.showAlert('Telegram user data is not loaded.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('https://genderparty.duckdns.org/api/v1/event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Telegram-ID': String(user.id),
                },
                body: JSON.stringify({
                    userId: user.id,
                    username: user.username ?? null,
                    gender,
                    revealDateTime: '2025-05-24T12:45:36.006+07:00',
                    title: 'Title',
                }),
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.id) {
                setQrUrl('https://genderparty.duckdns.org/qr/' + data.id);
            } else {
                WebApp.showAlert('No URL in the server response.');
            }
        } catch (error) {
            console.error(error);
            WebApp.showAlert(error instanceof Error ? error.message : 'Unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleShareImage = async () => {
        const size = 300;
        const markerSize = 120;

        try {
            if (!qrUrl) {
                WebApp.showAlert('QR code URL is not ready.');
                return;
            }

            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'fixed';
            tempContainer.style.left = '-9999px';
            document.body.appendChild(tempContainer);

            const root = createRoot(tempContainer);
            root.render(<QRCodeSVG value={qrUrl} size={size} level="H" />);

            // Ждём, чтобы React отрендерил SVG
            await new Promise((resolve) => setTimeout(resolve, 50));

            const svgElement = tempContainer.querySelector('svg');
            if (!svgElement) {
                WebApp.showAlert('Failed to get QR SVG element.');
                root.unmount();
                document.body.removeChild(tempContainer);
                return;
            }

            const svgData = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);

            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                WebApp.showAlert('Failed to get canvas context.');
                root.unmount();
                document.body.removeChild(tempContainer);
                URL.revokeObjectURL(svgUrl);
                return;
            }

            // Белый фон
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, size, size);

            const qrImage = new Image();
            qrImage.crossOrigin = 'anonymous';
            qrImage.src = svgUrl;

            qrImage.onload = () => {
                ctx.drawImage(qrImage, 0, 0, size, size);

                const markerImg = new Image();
                markerImg.crossOrigin = 'anonymous';
                markerImg.src = markerBase64;

                markerImg.onload = () => {
                    ctx.drawImage(markerImg, (size - markerSize) / 2, (size - markerSize) / 2, markerSize, markerSize);

                    canvas.toBlob(async (blob) => {
                        if (!blob) return;

                        const file = new File([blob], 'qrcode.png', { type: 'image/png' });

                        if (navigator.canShare && navigator.canShare({ files: [file] })) {
                            await navigator.share({
                                files: [file],
                                title: "Baby's gender QR",
                            });
                        } else {
                            const a = document.createElement('a');
                            a.href = URL.createObjectURL(file);
                            a.download = 'qrcode.png';
                            a.click();
                            WebApp.showAlert('Your browser does not support direct sharing — the file has been downloaded.');
                        }
                    }, 'image/png');

                    root.unmount();
                    document.body.removeChild(tempContainer);
                    URL.revokeObjectURL(svgUrl);
                };

                markerImg.onerror = () => {
                    WebApp.showAlert('Failed to load marker image.');
                    root.unmount();
                    document.body.removeChild(tempContainer);
                    URL.revokeObjectURL(svgUrl);
                };
            };

            qrImage.onerror = () => {
                WebApp.showAlert('Failed to load QR image.');
                root.unmount();
                document.body.removeChild(tempContainer);
                URL.revokeObjectURL(svgUrl);
            };
        } catch (error) {
            console.error(error);
            WebApp.showAlert('Failed to generate QR code image.');
        }
    };

    return (
        <div className="container">
            <h3>🎉 Select the baby's gender</h3>

            <div className="card">
                <button
                    onClick={() => setGender('boy')}
                    disabled={gender !== null}
                    style={{
                        backgroundColor: gender !== null ? '#999' : undefined,
                        color: gender !== null ? '#fff' : undefined,
                        cursor: gender !== null ? 'default' : 'pointer',
                        pointerEvents: gender !== null ? 'none' : 'auto',
                    }}
                >
                    👶 Boy
                </button>
                <button
                    onClick={() => setGender('girl')}
                    disabled={gender !== null}
                    style={{
                        backgroundColor: gender !== null ? '#999' : undefined,
                        color: gender !== null ? '#fff' : undefined,
                        cursor: gender !== null ? 'default' : 'pointer',
                        pointerEvents: gender !== null ? 'none' : 'auto',
                    }}
                >
                    🎀 Girl
                </button>
            </div>

            {gender !== null && (
                <p style={{ marginTop: '8px', fontStyle: 'italic', color: '#555' }}>
                    Gender selected
                </p>
            )}

            <div
                className="qr-section"
                style={{ marginTop: 20, position: 'relative', width: 300, height: 300 }}
                ref={qrRef}
            >
                {isLoading && (
                    <div className="loader" style={{ margin: '40px auto' }}>
                        <div className="spinner"></div>
                        <p>Generating QR code...</p>
                    </div>
                )}

                {!isLoading && qrUrl && (
                    <>
                        <QRCodeSVG
                            value={qrUrl}
                            size={300}
                            level="H"
                        />
                        <img
                            src={markerBase64}
                            alt="marker"
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                width: 120,
                                height: 120,
                                transform: 'translate(-50%, -50%)',
                                pointerEvents: 'none',
                            }}
                        />
                        {/* Переместим кнопку ВНУТРЬ этого контейнера */}
                        <button
                            onClick={handleShareImage}
                            style={{
                                position: 'absolute',
                                bottom: 10,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                padding: '8px 16px',
                                fontSize: '16px',
                                zIndex: 10,
                            }}
                        >
                            📤 Share
                        </button>
                    </>
                )}
            </div>

        </div>
    );
}

export default App;
