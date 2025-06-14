import './App.css';
import { useState, useEffect, useRef } from 'react';
import WebApp from '@twa-dev/sdk';
import 'react-datepicker/dist/react-datepicker.css';
import { QRCodeSVG } from 'qrcode.react';

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
                WebApp.showAlert('There is no url in the server response');
            }
        } catch (error) {
            console.error(error);
            WebApp.showAlert(error instanceof Error ? error.message : 'Unknown error');
        }
    };

    const handleShareImage = async () => {
        const svg = svgRef.current;
        if (!svg) {
            WebApp.showAlert('QR код ещё не готов');
            return;
        }

        try {
            const svgData = new XMLSerializer().serializeToString(svg);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            const image = new Image();
            image.src = url;

            image.onload = async () => {
                const canvas = document.createElement('canvas');
                canvas.width = svg.clientWidth;
                canvas.height = svg.clientHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(image, 0, 0);

                canvas.toBlob(async (blob) => {
                    if (!blob) return;

                    const file = new File([blob], 'qrcode.png', { type: 'image/png' });

                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            files: [file],
                            title: 'Gender Reveal QR',
                            text: 'Проверь сюрприз 🎉',
                        });
                    } else {
                        // fallback: скачать файл
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(file);
                        a.download = 'qrcode.png';
                        a.click();
                        WebApp.showAlert('Ваш браузер не поддерживает прямой шаринг — файл скачан.');
                    }
                }, 'image/png');
            };
        } catch (error) {
            console.error(error);
            WebApp.showAlert('Не удалось создать изображение QR-кода');
        }
    };

    return (
        <div className="container">
            <h3>🎉Select the baby's gender</h3>

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

            {qrUrl && (
                <div className="qr-section" style={{ marginTop: 20 }}>
                    <QRCodeSVG
                        ref={svgRef}
                        value={qrUrl}
                        size={300}
                        level="H"
                        imageSettings={{
                            src: './marker.png',
                            height: 120,
                            width: 120,
                            excavate: true,
                        }}
                    />
                    <div style={{ marginTop: 10 }}>
                        <button onClick={handleShareImage} style={{ padding: '8px 16px', fontSize: '16px' }}>
                            📤 Поделиться картинкой
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
