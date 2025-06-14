// App.tsx
import './App.css';
import { useState, useEffect, useRef } from 'react';
import WebApp from '@twa-dev/sdk';
import 'react-datepicker/dist/react-datepicker.css';
import { QRCodeSVG } from 'qrcode.react';
import { markerBase64 } from './markerBase64';

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
    const svgRef = useRef<SVGSVGElement>(null);

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
        const svg = svgRef.current;
        if (!svg) {
            WebApp.showAlert('QR code is not ready yet.');
            return;
        }

        try {
            // Убедимся, что маркер внутри SVG загружен
            const imageNode = svg.querySelector('image');
            if (imageNode) {
                const href = imageNode.getAttribute('xlink:href') || imageNode.getAttribute('href');
                if (href) {
                    await new Promise<void>((resolve, reject) => {
                        const preload = new Image();
                        preload.crossOrigin = 'anonymous'; // если нужно загрузить с другого домена
                        preload.src = href;
                        preload.onload = () => resolve();
                        preload.onerror = () => reject(new Error('Marker image failed to load'));
                    });
                }
            }

            // Добавим xmlns, чтобы не было проблем с рендерингом SVG
            let svgData = new XMLSerializer().serializeToString(svg);
            if (!svgData.includes('xmlns="http://www.w3.org/2000/svg"')) {
                svgData = svgData.replace(
                    '<svg',
                    '<svg xmlns="http://www.w3.org/2000/svg"'
                );
            }

            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            const image = new Image();
            image.crossOrigin = 'anonymous'; // на всякий случай
            image.src = url;

            await new Promise<void>((resolve, reject) => {
                image.onload = () => resolve();
                image.onerror = () => reject(new Error('Failed to load QR image'));
            });

            // Задаём canvas размер, совпадающий с size QRCodeSVG
            const canvas = document.createElement('canvas');
            const size = 300; // тот же, что и в QRCodeSVG props
            canvas.width = size;
            canvas.height = size;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                WebApp.showAlert('Failed to get canvas context.');
                return;
            }

            ctx.fillStyle = 'white'; // белый фон, чтобы не было прозрачности
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

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

            <div className="qr-section" style={{ marginTop: 20 }}>
                {isLoading && (
                    <div className="loader" style={{ margin: '40px auto' }}>
                        <div className="spinner"></div>
                        <p>Generating QR code...</p>
                    </div>
                )}

                {!isLoading && qrUrl && (
                    <>
                        <QRCodeSVG
                            ref={svgRef}
                            value={qrUrl}
                            size={300}
                            level="H"
                            imageSettings={{
                                src: markerBase64,
                                height: 120,
                                width: 120,
                                excavate: false,
                            }}
                        />
                        <div style={{ marginTop: 10 }}>
                            <button onClick={handleShareImage} style={{ padding: '8px 16px', fontSize: '16px' }}>
                                📤 Share
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default App;
